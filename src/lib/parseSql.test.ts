import { describe, expect, it } from 'vitest'

import { formatParseError, parseSql } from './parseSql'
import { SAMPLE_SCHEMA } from './sampleSchema'

describe('parseSql', () => {
  describe('empty and non-DDL input', () => {
    it('returns empty schema for empty string', () => {
      expect(parseSql('')).toEqual({ tables: [], relationships: [] })
    })

    it('returns empty schema for whitespace only', () => {
      expect(parseSql('   \n ')).toEqual({ tables: [], relationships: [] })
    })

    it('returns empty schema for SELECT statement', () => {
      expect(parseSql('SELECT 1;')).toEqual({ tables: [], relationships: [] })
    })
  })

  describe('basic CREATE TABLE', () => {
    it('parses a simple users table', () => {
      const result = parseSql(`
        CREATE TABLE users (
          id INT PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );
      `)

      expect(result.tables).toHaveLength(1)
      const table = result.tables[0]
      expect(table.name).toBe('users')
      expect(table.schema).toBe('public')

      expect(table.columns).toHaveLength(2)
      expect(table.columns[0].name).toBe('id')
      expect(table.columns[0].dataType).toBe('INT')
      expect(table.columns[0].isPrimaryKey).toBe(true)
      expect(table.columns[0].isNullable).toBe(true)

      expect(table.columns[1].name).toBe('name')
      expect(table.columns[1].dataType).toBe('VARCHAR(255)')
      expect(table.columns[1].isNullable).toBe(false)
    })
  })

  describe('nullable default and NOT NULL', () => {
    it('marks plain columns nullable and NOT NULL columns non-nullable', () => {
      const result = parseSql(`CREATE TABLE t (a TEXT, b TEXT NOT NULL);`)

      expect(result.tables[0].columns[0].isNullable).toBe(true)
      expect(result.tables[0].columns[1].isNullable).toBe(false)
    })
  })

  describe('primary key styles', () => {
    it('marks inline primary keys', () => {
      const result = parseSql(`CREATE TABLE inline_pk (id INT PRIMARY KEY);`)
      expect(result.tables[0].columns[0].isPrimaryKey).toBe(true)
    })

    it('marks table-level composite primary keys', () => {
      const result = parseSql(`
        CREATE TABLE table_pk (
          a INT,
          b INT,
          PRIMARY KEY (a, b)
        );
      `)

      const cols = result.tables[0].columns
      expect(cols.find((c) => c.name === 'a')?.isPrimaryKey).toBe(true)
      expect(cols.find((c) => c.name === 'b')?.isPrimaryKey).toBe(true)
    })
  })

  describe('unique constraints', () => {
    it('marks inline and table-level unique columns', () => {
      const result = parseSql(`
        CREATE TABLE t (
          email TEXT UNIQUE,
          username TEXT,
          UNIQUE (username)
        );
      `)

      const cols = result.tables[0].columns
      expect(cols.find((c) => c.name === 'email')?.isUnique).toBe(true)
      expect(cols.find((c) => c.name === 'username')?.isUnique).toBe(true)
    })
  })

  describe('identity / serial columns', () => {
    it('detects SERIAL and BIGSERIAL as identity', () => {
      const result = parseSql(`
        CREATE TABLE t (
          id SERIAL PRIMARY KEY,
          big_id BIGSERIAL PRIMARY KEY
        );
      `)

      const cols = result.tables[0].columns
      expect(cols.find((c) => c.name === 'id')?.isIdentity).toBe(true)
      expect(cols.find((c) => c.name === 'big_id')?.isIdentity).toBe(true)
    })
  })

  describe('data types with lengths', () => {
    it('preserves length and scale information', () => {
      const result = parseSql(`
        CREATE TABLE t (
          a DECIMAL(10, 2),
          b VARCHAR(100),
          c CHAR
        );
      `)

      const cols = result.tables[0].columns
      expect(cols.find((c) => c.name === 'a')?.dataType).toBe('DECIMAL(10, 2)')
      expect(cols.find((c) => c.name === 'b')?.dataType).toBe('VARCHAR(100)')
      expect(cols.find((c) => c.name === 'c')?.dataType).toBe('CHAR')
    })
  })

  describe('default values', () => {
    it('extracts common default expressions', () => {
      const result = parseSql(`
        CREATE TABLE t (
          ts TIMESTAMPTZ DEFAULT NOW(),
          active BOOLEAN DEFAULT FALSE,
          count INT DEFAULT 0,
          label VARCHAR DEFAULT 'none'
        );
      `)

      const cols = result.tables[0].columns
      expect(cols.find((c) => c.name === 'ts')?.defaultValue).toBeTruthy()
      expect(cols.find((c) => c.name === 'active')?.defaultValue).toBe('false')
      expect(cols.find((c) => c.name === 'count')?.defaultValue).toBe('0')
      expect(cols.find((c) => c.name === 'label')?.defaultValue).toBe('none')
    })
  })

  describe('inline foreign key', () => {
    it('creates a relationship for inline REFERENCES', () => {
      const result = parseSql(`
        CREATE TABLE users (
          id INT PRIMARY KEY
        );

        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT REFERENCES users(id)
        );
      `)

      expect(result.relationships).toHaveLength(1)
      const rel = result.relationships[0]
      expect(rel.sourceSchema).toBe('public')
      expect(rel.sourceTable).toBe('posts')
      expect(rel.sourceColumn).toBe('user_id')
      expect(rel.targetSchema).toBe('public')
      expect(rel.targetTable).toBe('users')
      expect(rel.targetColumn).toBe('id')
      expect(rel.constraintName).toBe('posts_user_id_fkey')
    })
  })

  describe('table-level foreign key constraint', () => {
    it('creates a relationship for CONSTRAINT FOREIGN KEY', () => {
      const result = parseSql(`
        CREATE TABLE posts (
          id INT PRIMARY KEY
        );

        CREATE TABLE comments (
          id INT PRIMARY KEY,
          post_id INT,
          CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id)
        );
      `)

      expect(result.relationships).toHaveLength(1)
      const rel = result.relationships[0]
      expect(rel.constraintName).toBe('fk_post')
      expect(rel.sourceSchema).toBe('public')
      expect(rel.sourceTable).toBe('comments')
      expect(rel.sourceColumn).toBe('post_id')
      expect(rel.targetSchema).toBe('public')
      expect(rel.targetTable).toBe('posts')
      expect(rel.targetColumn).toBe('id')
    })
  })

  describe('multi-column FK constraint', () => {
    it('emits one relationship per column pair', () => {
      const result = parseSql(`
        CREATE TABLE parents (
          a INT,
          b INT,
          PRIMARY KEY (a, b)
        );

        CREATE TABLE children (
          a INT,
          b INT,
          FOREIGN KEY (a, b) REFERENCES parents(a, b)
        );
      `)

      expect(result.relationships).toHaveLength(2)
      expect(result.relationships.some((r) => r.sourceColumn === 'a' && r.targetColumn === 'a')).toBe(true)
      expect(result.relationships.some((r) => r.sourceColumn === 'b' && r.targetColumn === 'b')).toBe(true)
    })
  })

  describe('ALTER TABLE ADD FOREIGN KEY', () => {
    it('creates relationships from ALTER TABLE ADD CONSTRAINT', () => {
      const result = parseSql(`
        CREATE TABLE users (id INT PRIMARY KEY);
        CREATE TABLE orders (id INT PRIMARY KEY, user_id INT);
        ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
      `)

      expect(result.tables).toHaveLength(2)
      expect(result.relationships).toHaveLength(1)
      const rel = result.relationships[0]
      expect(rel.sourceSchema).toBe('public')
      expect(rel.sourceTable).toBe('orders')
      expect(rel.sourceColumn).toBe('user_id')
      expect(rel.targetSchema).toBe('public')
      expect(rel.targetTable).toBe('users')
      expect(rel.targetColumn).toBe('id')
    })
  })

  describe('cross-schema references', () => {
    it('preserves schema names and resolves cross-schema FKs', () => {
      const result = parseSql(`
        CREATE TABLE auth.users (
          id UUID PRIMARY KEY
        );

        CREATE TABLE public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id)
        );
      `)

      const authUsers = result.tables.find((t) => t.name === 'users' && t.schema === 'auth')
      const publicProfiles = result.tables.find((t) => t.name === 'profiles' && t.schema === 'public')
      expect(authUsers).toBeDefined()
      expect(publicProfiles).toBeDefined()

      expect(result.relationships).toHaveLength(1)
      const rel = result.relationships[0]
      expect(rel.sourceSchema).toBe('public')
      expect(rel.sourceTable).toBe('profiles')
      expect(rel.sourceColumn).toBe('id')
      expect(rel.targetSchema).toBe('auth')
      expect(rel.targetTable).toBe('users')
      expect(rel.targetColumn).toBe('id')
    })
  })

  describe('same table name in different schemas', () => {
    it('keeps both tables and targets the correct schema', () => {
      const result = parseSql(`
        CREATE TABLE auth.users (id UUID PRIMARY KEY);
        CREATE TABLE public.users (id UUID PRIMARY KEY);
        CREATE TABLE public.profiles (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id)
        );
      `)

      const authUsers = result.tables.find((t) => t.name === 'users' && t.schema === 'auth')
      const publicUsers = result.tables.find((t) => t.name === 'users' && t.schema === 'public')
      expect(authUsers).toBeDefined()
      expect(publicUsers).toBeDefined()

      const rel = result.relationships.find((r) => r.sourceTable === 'profiles')
      expect(rel?.targetTable).toBe('users')
      expect(rel?.targetSchema).toBe('auth')
    })
  })

  describe('quoted identifiers', () => {
    it('strips quotes from schema, table, and column names', () => {
      const result = parseSql(`
        CREATE TABLE "my-schema"."User" (
          "ID" INT PRIMARY KEY
        );
      `)

      expect(result.tables).toHaveLength(1)
      const table = result.tables[0]
      expect(table.name).toBe('User')
      expect(table.schema).toBe('my-schema')
      expect(table.columns[0].name).toBe('ID')
    })
  })

  describe('formatParseError', () => {
    it('extracts messages from Error, string, and null inputs', () => {
      expect(formatParseError(new Error('syntax error'))).toBe('syntax error')
      expect(formatParseError('bad')).toBe('bad')
      expect(formatParseError(null)).toBe('Failed to parse SQL. Please check your syntax.')
    })
  })

  describe('sample schema fixture', () => {
    it('parses SAMPLE_SCHEMA with expected tables and relationships', () => {
      const result = parseSql(SAMPLE_SCHEMA)

      expect(result.tables.map((t) => `${t.schema}.${t.name}`).sort()).toEqual([
        'app.authors',
        'app.comments',
        'app.post_tags',
        'app.posts',
        'app.tags',
      ])

      const rels = result.relationships
      expect(rels).toHaveLength(4)

      expect(rels.some((r) => r.sourceTable === 'posts' && r.sourceColumn === 'author_id' && r.targetTable === 'authors')).toBe(true)
      expect(rels.some((r) => r.sourceTable === 'post_tags' && r.sourceColumn === 'post_id' && r.targetTable === 'posts')).toBe(true)
      expect(rels.some((r) => r.sourceTable === 'post_tags' && r.sourceColumn === 'tag_id' && r.targetTable === 'tags')).toBe(true)
      expect(rels.some((r) => r.sourceTable === 'comments' && r.sourceColumn === 'post_id' && r.targetTable === 'posts')).toBe(true)
    })
  })
})
