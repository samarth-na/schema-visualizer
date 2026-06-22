import { describe, expect, it } from 'vitest'

import { getGraphDataFromTables, getLayoutedElementsViaDagre } from './graph'
import type { ParsedRelationship, ParsedTable } from './types'

describe('getGraphDataFromTables', () => {
  it('returns empty nodes and edges for empty tables', () => {
    const result = getGraphDataFromTables('public', [], [])
    expect(result.nodes).toEqual([])
    expect(result.edges).toEqual([])
  })

  it('creates one node and zero edges for a single table', () => {
    const result = getGraphDataFromTables('public', [makeTable('public', 'users')], [])

    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].id).toBe('public.users')
    expect(result.nodes[0].data.schema).toBe('public')
    expect(result.nodes[0].data.name).toBe('users')
    expect(result.edges).toHaveLength(0)
  })

  it('creates two nodes and one edge for a simple FK', () => {
    const tables = [makeTable('public', 'users'), makeTable('public', 'posts')]
    const relationships: ParsedRelationship[] = [
      {
        id: 'rel1',
        constraintName: 'fk_posts_user',
        sourceSchema: 'public',
        sourceTable: 'posts',
        sourceColumn: 'user_id',
        targetSchema: 'public',
        targetTable: 'users',
        targetColumn: 'id',
      },
    ]

    const result = getGraphDataFromTables('public', tables, relationships)

    expect(result.nodes).toHaveLength(2)
    expect(result.edges).toHaveLength(1)

    const edge = result.edges[0]
    expect(edge.source).toBe('public.posts')
    expect(edge.target).toBe('public.users')
    expect(edge.sourceHandle).toBe('public.posts.user_id')
    expect(edge.targetHandle).toBe('public.users.id')
  })

  it('creates a synthetic foreign node for cross-schema missing target', () => {
    const tables = [makeTable('public', 'profiles')]
    const relationships: ParsedRelationship[] = [
      {
        id: 'rel1',
        constraintName: 'fk_profiles_user',
        sourceSchema: 'public',
        sourceTable: 'profiles',
        sourceColumn: 'user_id',
        targetSchema: 'auth',
        targetTable: 'users',
        targetColumn: 'id',
      },
    ]

    const result = getGraphDataFromTables('public', tables, relationships)

    expect(result.nodes).toHaveLength(2)
    expect(result.nodes.some((n) => n.id === 'auth.users.id')).toBe(true)

    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].source).toBe('public.profiles')
    expect(result.edges[0].target).toBe('auth.users.id')
  })

  it('deduplicates relationships by id', () => {
    const tables = [makeTable('public', 'users'), makeTable('public', 'posts')]
    const relationships: ParsedRelationship[] = [
      {
        id: 'rel1',
        constraintName: 'fk_posts_user',
        sourceSchema: 'public',
        sourceTable: 'posts',
        sourceColumn: 'user_id',
        targetSchema: 'public',
        targetTable: 'users',
        targetColumn: 'id',
      },
      {
        id: 'rel1',
        constraintName: 'fk_posts_user_dup',
        sourceSchema: 'public',
        sourceTable: 'posts',
        sourceColumn: 'user_id',
        targetSchema: 'public',
        targetTable: 'users',
        targetColumn: 'id',
      },
    ]

    const result = getGraphDataFromTables('public', tables, relationships)
    expect(result.edges).toHaveLength(1)
  })

  it('uses schema-qualified node ids so same table names in different schemas do not collide', () => {
    const tables = [
      makeTable('auth', 'users'),
      makeTable('public', 'users'),
      makeTable('public', 'profiles'),
    ]
    const relationships: ParsedRelationship[] = [
      {
        id: 'rel1',
        constraintName: 'fk_profiles_user',
        sourceSchema: 'public',
        sourceTable: 'profiles',
        sourceColumn: 'user_id',
        targetSchema: 'auth',
        targetTable: 'users',
        targetColumn: 'id',
      },
    ]

    const result = getGraphDataFromTables('public', tables, relationships)

    const nodeIds = result.nodes.map((n) => n.id)
    expect(nodeIds).toContain('auth.users')
    expect(nodeIds).toContain('public.users')
    expect(nodeIds).toHaveLength(3)

    expect(result.edges[0].target).toBe('auth.users')
  })
})

describe('getLayoutedElementsViaDagre', () => {
  it('assigns numeric positions to nodes', () => {
    const nodes = [
      {
        id: 'public.users',
        type: 'table',
        data: {
          id: 'public.users',
          schema: 'public',
          name: 'users',
          comment: null,
          isForeign: false,
          columns: [],
        },
        position: { x: 0, y: 0 },
      },
    ] as const

    const { nodes: layoutedNodes } = getLayoutedElementsViaDagre(nodes as any, [])
    expect(typeof layoutedNodes[0].position.x).toBe('number')
    expect(typeof layoutedNodes[0].position.y).toBe('number')
  })
})

function makeTable(schema: string, name: string): ParsedTable {
  return {
    schema,
    name,
    comment: null,
    columns: [
      {
        name: 'id',
        dataType: 'INT',
        isPrimaryKey: true,
        isNullable: false,
        isUnique: false,
        isIdentity: false,
        defaultValue: null,
        comment: null,
      },
      {
        name: 'user_id',
        dataType: 'INT',
        isPrimaryKey: false,
        isNullable: true,
        isUnique: false,
        isIdentity: false,
        defaultValue: null,
        comment: null,
      },
    ],
  }
}
