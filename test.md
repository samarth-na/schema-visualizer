# Test Plan — Schema Visualizer

Updated: 2026-06-23  
Related docs: `gpt5.5-report.md`, `AUDIT.md`, `PHASE1_PLAN.md`, `fallow.md`

## Purpose

The most fragile part of this project is `src/lib/parseSql.ts`, because it relies on `node-sql-parser` AST shapes and uses broad casts. Tests should land before major parser refactors or schema-qualified relationship changes.

This plan prioritizes pure logic tests first, then graph tests, then component and optional E2E tests.

## Recommended Framework

Use **Vitest** for unit tests.

For component tests, add **@testing-library/react** and **jsdom**.

### Minimal install for parser/lib tests

```sh
npm install -D vitest
```

### Full install for component tests

```sh
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### Scripts to add to `package.json`

Recommended:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Optional UI script if Vitest UI is installed separately:

```json
"test:ui": "vitest --ui"
```

## Vitest Config

Create `vitest.config.ts` if component tests or aliases need config:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

For pure parser tests only, Vitest may work without a config depending on alias usage.

## Priority 1 — Parser Tests

File: `src/lib/parseSql.test.ts`

Goal: lock down existing parser behavior before fixing/refactoring it.

### 1. Empty and non-DDL input

```ts
expect(parseSql('')).toEqual({ tables: [], relationships: [] })
expect(parseSql('   \n ')).toEqual({ tables: [], relationships: [] })
expect(parseSql('SELECT 1;')).toEqual({ tables: [], relationships: [] })
```

### 2. Basic `CREATE TABLE`

SQL:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
```

Assertions:

| Field | Expected |
|---|---|
| `tables.length` | `1` |
| `tables[0].name` | `'users'` |
| `tables[0].schema` | `'public'` |
| `columns[0].name` | `'id'` |
| `columns[0].dataType` | `'INT'` |
| `columns[0].isPrimaryKey` | `true` |
| `columns[0].isNullable` | `true` unless primary-key nullability is intentionally changed |
| `columns[1].name` | `'name'` |
| `columns[1].dataType` | `'VARCHAR(255)'` |
| `columns[1].isNullable` | `false` |

### 3. Nullable default and `NOT NULL`

SQL:

```sql
CREATE TABLE t (a TEXT, b TEXT NOT NULL);
```

Assertions:

| Field | Expected |
|---|---|
| `a.isNullable` | `true` |
| `b.isNullable` | `false` |

This catches the `isNotNull` early-return bug.

### 4. Primary key styles

SQL:

```sql
CREATE TABLE inline_pk (
  id INT PRIMARY KEY
);

CREATE TABLE table_pk (
  a INT,
  b INT,
  PRIMARY KEY (a, b)
);
```

Assertions:

- Inline primary key is marked primary.
- Both `a` and `b` are marked primary for table-level PK.

### 5. Unique constraints

SQL:

```sql
CREATE TABLE t (
  email TEXT UNIQUE,
  username TEXT,
  UNIQUE (username)
);
```

Assertions:

- `email.isUnique === true`
- `username.isUnique === true`

### 6. Identity / serial columns

SQL:

```sql
CREATE TABLE t (
  id SERIAL PRIMARY KEY,
  big_id BIGSERIAL PRIMARY KEY
);
```

Assertions:

| Field | Expected |
|---|---|
| `id.isIdentity` | `true` |
| `big_id.isIdentity` | `true` |

### 7. Data types with lengths

SQL:

```sql
CREATE TABLE t (
  a DECIMAL(10, 2),
  b VARCHAR(100),
  c CHAR
);
```

Assertions:

| Field | Expected |
|---|---|
| `a.dataType` | `'DECIMAL(10, 2)'` |
| `b.dataType` | `'VARCHAR(100)'` |
| `c.dataType` | `'CHAR'` |

### 8. Default values

SQL:

```sql
CREATE TABLE t (
  ts TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT FALSE,
  count INT DEFAULT 0,
  label VARCHAR DEFAULT 'none'
);
```

Assertions:

- All four columns have non-null `defaultValue`.
- Values are stable enough for SQL copy output.

### 9. Inline foreign key

SQL:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id)
);
```

Current assertions:

| Field | Expected |
|---|---|
| `relationships.length` | `1` |
| `relationships[0].sourceTable` | `'posts'` |
| `relationships[0].sourceColumn` | `'user_id'` |
| `relationships[0].targetTable` | `'users'` |
| `relationships[0].targetColumn` | `'id'` |
| `relationships[0].constraintName` | `'posts_user_id_fkey'` |

Future assertions after schema fields are added:

| Field | Expected |
|---|---|
| `relationships[0].sourceSchema` | `'public'` |
| `relationships[0].targetSchema` | `'public'` |

### 10. Table-level foreign key constraint

SQL:

```sql
CREATE TABLE posts (
  id INT PRIMARY KEY
);

CREATE TABLE comments (
  id INT PRIMARY KEY,
  post_id INT,
  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

Assertions:

| Field | Expected |
|---|---|
| `relationships.length` | `1` |
| `relationships[0].constraintName` | `'fk_post'` |
| `relationships[0].sourceTable` | `'comments'` |
| `relationships[0].sourceColumn` | `'post_id'` |
| `relationships[0].targetTable` | `'posts'` |
| `relationships[0].targetColumn` | `'id'` |

### 11. Multi-column FK constraint

SQL:

```sql
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
```

Assertions:

- Two relationships are emitted.
- `children.a -> parents.a` exists.
- `children.b -> parents.b` exists.

### 12. `ALTER TABLE ADD FOREIGN KEY`

SQL:

```sql
CREATE TABLE users (id INT PRIMARY KEY);
CREATE TABLE orders (id INT PRIMARY KEY, user_id INT);
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
```

Assertions:

| Field | Expected |
|---|---|
| `tables.length` | `2` |
| `relationships.length` | `1` |
| `relationships[0].sourceTable` | `'orders'` |
| `relationships[0].sourceColumn` | `'user_id'` |
| `relationships[0].targetTable` | `'users'` |
| `relationships[0].targetColumn` | `'id'` |

### 13. Cross-schema references

SQL:

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id)
);
```

Current assertions:

| Field | Expected |
|---|---|
| `auth.users.schema` | `'auth'` |
| `public.profiles.schema` | `'public'` |
| Relationship target table | `'users'` |
| Relationship target column | `'id'` |

Future assertions after schema fields are added:

| Field | Expected |
|---|---|
| `relationship.sourceSchema` | `'public'` |
| `relationship.targetSchema` | `'auth'` |

### 14. Same table name in different schemas

SQL:

```sql
CREATE TABLE auth.users (id UUID PRIMARY KEY);
CREATE TABLE public.users (id UUID PRIMARY KEY);
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id)
);
```

Future behavior to assert after schema-qualified relationship work:

- Both `auth.users` and `public.users` are preserved as distinct tables.
- `profiles.user_id` targets `auth.users.id`, not `public.users.id`.
- Graph node IDs are schema-qualified.

### 15. Quoted identifiers

SQL:

```sql
CREATE TABLE "my-schema"."User" (
  "ID" INT PRIMARY KEY
);
```

Assertions:

| Field | Expected |
|---|---|
| Table name | `'User'` |
| Schema | `'my-schema'` |
| Column name | `'ID'` |

### 16. `formatParseError`

```ts
expect(formatParseError(new Error('syntax error'))).toBe('syntax error')
expect(formatParseError('bad')).toBe('bad')
expect(formatParseError(null)).toBe('Failed to parse SQL. Please check your syntax.')
```

### 17. Sample schema fixture

Use `SAMPLE_SCHEMA` from `src/lib/sampleSchema.ts`.

Assertions should match the current sample, including:

- Expected table count.
- Expected table names.
- Expected relationship count.
- Relationship endpoints for each FK.

Do not hardcode stale counts without checking the current sample file first.

## Priority 2 — Utility Tests

File: `src/lib/utils.test.ts`

| Test | Assertions |
|---|---|
| `cn('flex', 'hidden')` | Tailwind merge conflict resolves to expected class output. |
| `cn('px-4', 'px-2')` | Later conflicting padding wins. |
| `cn(false && 'hidden')` | Falsy values omitted. |
| `getSchemaAsMarkdown` | Only tables for the requested schema are included. |
| Markdown escaping | Pipes/backticks/newlines are escaped or normalized. |
| `tablesToSQL` | Output includes table names, columns, types, PK, `NOT NULL`, `UNIQUE`, `GENERATED ALWAYS AS IDENTITY`, and `DEFAULT`. |

Note: `getTableDefinitionAsMarkdown` may become internal-only after Phase 1, so prefer testing through `getSchemaAsMarkdown` unless the helper remains exported.

## Priority 3 — Graph Tests

File: `src/lib/graph.test.ts`

These are mostly structural tests. Dagre may be used directly if stable enough, or mocked if layout makes tests brittle.

| Test | Assertions |
|---|---|
| Empty tables | Returns `{ nodes: [], edges: [] }`. |
| One table, no relationships | One table node, zero edges. |
| Two tables with FK | Two nodes, one edge with matching source/target handles. |
| Cross-schema/missing target FK | Synthetic foreign node is created. |
| Duplicate relationship IDs | Deduplicated via `uniqueRels`. |
| Dagre layout | Nodes receive numeric positions. |
| Future schema-qualified IDs | Same table names in different schemas do not collide. |

## Priority 4 — Page and Component Tests

Use `@testing-library/react`. Mock `@xyflow/react`, `navigator.clipboard`, and `sonner` where needed.

| Component | Test | Assertion |
|---|---|---|
| `Home` page | Empty input | Render button disabled. |
| `Home` page | Paste SQL and click Render | Parser result is passed to graph canvas; success toast shown. |
| `Home` page | Click Load example | Textarea populated, schema set, toast shown. |
| `Home` page | Select schema | Only matching tables and relevant relationships passed to canvas. |
| `Home` page | Clear | SQL cleared, schema reset, error cleared. |
| `FindTableSelector` | Type filter | Only matching tables shown. |
| `FindTableSelector` | Select table | `onSelect` called with selected table name/ID. |
| `Toolbar` | Disabled state | Buttons disabled when no tables. |
| `Toolbar` | Click Copy SQL | `onCopySQL` called. |
| `Toolbar` | Click Copy Markdown | `onCopyMarkdown` called. |
| `TableNode` | Renders PK/nullable/unique/identity icons | Expected row content visible. |
| `DefaultEdge` | Selected edge | Relationship label renders. |
| `SchemaGraphLegend` | Render | Legend labels visible. |

## Priority 5 — Optional E2E Smoke Test

Use Playwright only if browser-level confidence is needed.

Scenario:

1. Start dev server.
2. Open `/`.
3. Paste `SAMPLE_SCHEMA`.
4. Click **Render Graph**.
5. Verify at least one `.react-flow__node` exists.
6. Verify success toast appears.
7. Use toolbar to copy/export if browser APIs are mockable.

## Suggested Test File Structure

```txt
src/
  lib/
    parseSql.test.ts
    utils.test.ts
    graph.test.ts
  app/
    page.test.tsx
  components/
    __tests__/
      Toolbar.test.tsx
      FindTableSelector.test.tsx
      TableNode.test.tsx
      DefaultEdge.test.tsx
      SchemaGraphLegend.test.tsx
```

## Implementation Order

1. Install Vitest and add scripts.
2. Add `parseSql.test.ts` with current behavior tests.
3. Fix `isNotNull` and update/confirm tests.
4. Add cross-schema tests that currently expose relationship-model limitations.
5. Add schema fields to `ParsedRelationship` and update tests.
6. Add `utils.test.ts` and `graph.test.ts`.
7. Add component tests only after pure logic is stable.

## Validation Commands

After test setup:

```sh
npm run test
npm run typecheck
npm run build
```

If scripts do not exist yet:

```sh
npx vitest run
npx tsc --noEmit
npm run build
```

## Notes

- Avoid snapshot-heavy tests for React Flow output; assert structural behavior instead.
- Parser tests should prefer realistic SQL fixtures over tiny synthetic AST assumptions.
- For future relationship schema fields, update tests and implementation together.
- Keep graph layout tests tolerant of exact coordinates unless deterministic layout is required.
