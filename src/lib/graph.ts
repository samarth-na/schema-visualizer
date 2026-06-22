import dagre from '@dagrejs/dagre'
import { Position } from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'

import type { ParsedRelationship, ParsedTable, TableNodeData } from './types'
import { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH } from './constants'

const NODE_SEP = 25
const RANK_SEP = 50

export function getGraphDataFromTables(
  schemaName: string,
  tables: ParsedTable[],
  relationships: ParsedRelationship[]
): {
  nodes: Node<TableNodeData>[]
  edges: Edge[]
} {
  if (!tables.length) {
    return { nodes: [], edges: [] }
  }

  const tableByName = new Map<string, ParsedTable>()
  const columnIdByName = new Map<string, Map<string, string>>()

  for (const table of tables) {
    tableByName.set(table.name, table)
    const colMap = new Map<string, string>()
    for (const col of table.columns) {
      colMap.set(col.name, `${table.name}.${col.name}`)
    }
    columnIdByName.set(table.name, colMap)
  }

  const nodes: Node<TableNodeData>[] = tables.map((table) => {
    const columns = table.columns.map((column) => ({
      id: `${table.name}.${column.name}`,
      name: column.name,
      format: column.dataType,
      isPrimary: column.isPrimaryKey,
      isNullable: column.isNullable,
      isUnique: column.isUnique,
      isIdentity: column.isIdentity,
      description: column.comment ?? '',
    }))

    return {
      id: table.name,
      type: 'table',
      data: {
        id: table.name,
        schema: table.schema,
        name: table.name,
        comment: table.comment,
        isForeign: false,
        columns,
      },
      position: { x: 0, y: 0 },
    }
  })

  const edges: Edge[] = []
  const uniqueRels = new Map<string, ParsedRelationship>()
  for (const rel of relationships) {
    uniqueRels.set(rel.id, rel)
  }

  for (const rel of uniqueRels.values()) {
    // Skip relationships pointing outside the selected schema
    const targetTable = tableByName.get(rel.targetTable)
    if (!targetTable) {
      // Cross-schema reference: create a synthetic foreign node
      const targetId = `${rel.targetTable}.${rel.targetColumn}`
      if (!nodes.some((n) => n.id === targetId)) {
        nodes.push({
          id: targetId,
          type: 'table',
          data: {
            id: targetId,
            schema: rel.targetTable, // we don't know schema; use table name as placeholder
            name: targetId,
            comment: null,
            isForeign: true,
            columns: [],
          },
          position: { x: 0, y: 0 },
        })
      }

      const sourceColId = columnIdByName.get(rel.sourceTable)?.get(rel.sourceColumn)
      if (sourceColId) {
        edges.push({
          id: rel.id,
          source: rel.sourceTable,
          sourceHandle: sourceColId,
          target: targetId,
          targetHandle: targetId,
          type: 'default',
          data: {
            sourceName: rel.sourceTable,
            sourceSchemaName: schemaName,
            sourceColumnName: rel.sourceColumn,
            targetName: rel.targetTable,
            targetSchemaName: rel.targetTable,
            targetColumnName: rel.targetColumn,
          },
        })
      }
      continue
    }

    const sourceColId = columnIdByName.get(rel.sourceTable)?.get(rel.sourceColumn)
    const targetColId = columnIdByName.get(rel.targetTable)?.get(rel.targetColumn)

    if (sourceColId && targetColId) {
      edges.push({
        id: rel.id,
        source: rel.sourceTable,
        sourceHandle: sourceColId,
        target: rel.targetTable,
        targetHandle: targetColId,
        type: 'default',
        data: {
          sourceName: rel.sourceTable,
          sourceSchemaName: schemaName,
          sourceColumnName: rel.sourceColumn,
          targetName: rel.targetTable,
          targetSchemaName: targetTable.schema,
          targetColumnName: rel.targetColumn,
        },
      })
    }
  }

  return getLayoutedElementsViaDagre(nodes, edges)
}

export const getLayoutedElementsViaDagre = (
  nodes: Node<TableNodeData>[],
  edges: Edge[]
): { nodes: Node<TableNodeData>[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'LR',
    align: 'UR',
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: TABLE_NODE_WIDTH / 2,
      height: (TABLE_NODE_ROW_HEIGHT / 2) * (node.data.columns.length + 1),
    })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Left
    node.sourcePosition = Position.Right
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    }
  })

  return { nodes, edges }
}

