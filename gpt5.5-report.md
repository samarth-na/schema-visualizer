# GPT-5.5 Codebase Review Report

Reviewed project: `schema-visualizer`  
Date: 2026-06-23  
Stack: Next.js 16.2.9, React 19.2.4, Tailwind 4, `@xyflow/react`, `@dagrejs/dagre`, `node-sql-parser`  
Companion reports: `AUDIT.md`, `PHASE1_PLAN.md`, `fallow.md`

## Executive Summary

`schema-visualizer` is a compact single-page App Router application that parses PostgreSQL DDL and renders an interactive ER diagram. The codebase is readable and builds successfully, with a sensible split between UI components in `src/components/` and pure logic in `src/lib/`.

The main risks are not framework setup or basic architecture. They are:

1. Relationship correctness for multi-schema PostgreSQL databases.
2. Parser fragility around untyped `node-sql-parser` AST shapes.
3. Missing tests around the parser and graph transformations.
4. React Flow attribution/license compliance.
5. Dead exports, duplicated constants, duplicated SQL serialization, and high-complexity functions reported by Fallow.

The recommended approach is to make small safe cleanup changes first, add parser tests, then refactor schema-qualified relationship handling and parser internals.

## Validation Performed

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed |
| `npx fallow` | Ran; exited non-zero because findings were detected |
| `npx fallow dead-code` | Ran; found unused exports/types and duplicate exports |
| `npx fallow dupes` | Ran; found duplicated blocks in `src/lib/parseSql.ts` |
| `npx fallow health` | Ran; reported health score `82 B` |
| `npx fallow fix --dry-run` | Ran; preview only, no files modified |

There are currently no `lint` or `test` scripts in `package.json`.

## Current Fallow Snapshot

From `fallow.md`:

- Files analyzed: 18
- LOC: 1,961
- Dead files: 0.0%
- Dead exports: 21.1% (`8 of 38`)
- Duplication: 52 lines, 2.8%, across 1 file
- Maintainability index: 89.0, rated good
- Health score: 82 B
- Top refactoring targets:
  1. `src/components/TableNode.tsx` — dead exports
  2. `src/lib/parseSql.ts` — complexity and duplication
  3. `src/lib/graph.ts` — dead exports

## Strengths

- `src/app/page.tsx` keeps the product flow straightforward: SQL input, parse, schema selection, graph render.
- `src/lib/types.ts` centralizes app-level schema, table, column, and edge data types.
- Pure logic is mostly isolated in `src/lib/parseSql.ts`, `src/lib/graph.ts`, and `src/lib/utils.ts`.
- React Flow integration memoizes `nodeTypes` and `edgeTypes` in `src/components/SchemaGraphCanvas.tsx`.
- `TableNode` is memoized with a custom comparator in `src/components/TableNode.tsx`.
- Production build succeeds on Next.js 16/Turbopack.
- The repository already has useful audit documents: `AUDIT.md`, `PHASE1_PLAN.md`, and `fallow.md`.

## High-Priority Findings and Detailed Suggested Changes

### 1. React Flow attribution is hidden

File: `src/components/SchemaGraphCanvas.tsx`

Current code:

```tsx
proOptions={{ hideAttribution: true }}
```

This hides React Flow attribution. Under the free `@xyflow/react` license, this is not allowed unless the project has a paid Pro entitlement.

#### Suggested change

Remove the prop entirely:

```tsx
<ReactFlow
  defaultNodes={[]}
  defaultEdges={[]}
  defaultEdgeOptions={{
    type: 'default',
    animated: false,
    deletable: false,
  }}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  fitView
  minZoom={0.2}
  maxZoom={2}
  onlyRenderVisibleElements
  onSelectionChange={handleSelectionChange}
>
```

#### Validation

Run:

```sh
npx tsc --noEmit
npm run build
```

#### Risk

Low. Visual output changes only by restoring the attribution badge.

---

### 2. Cross-schema relationship filtering is incorrect

File: `src/app/page.tsx`

Current issue:

```ts
relationships: schema.relationships.filter(
  (r) =>
    schema.tables.find((t) => t.name === r.sourceTable && t.schema === selectedSchema) !==
    undefined
),
```

This only preserves relationships whose source table is in the selected schema. Relationships where the selected schema contains the target table but not the source are dropped.

#### Minimal suggested change

Add endpoint checks for both source and target tables:

```ts
const filteredSchema = useMemo(() => {
  if (!selectedSchema) return schema

  const tableInSelectedSchema = (tableName: string) =>
    schema.tables.some((t) => t.name === tableName && t.schema === selectedSchema)

  return {
    tables: schema.tables.filter((t) => t.schema === selectedSchema),
    relationships: schema.relationships.filter(
      (r) => tableInSelectedSchema(r.sourceTable) || tableInSelectedSchema(r.targetTable)
    ),
  }
}, [schema, selectedSchema])
```

#### Better long-term change

Extend `ParsedRelationship` to include schemas and filter directly:

```ts
export type ParsedRelationship = {
  id: string
  constraintName: string
  sourceSchema: string
  sourceTable: string
  sourceColumn: string
  targetSchema: string
  targetTable: string
  targetColumn: string
}
```

Then:

```ts
relationships: schema.relationships.filter(
  (r) => r.sourceSchema === selectedSchema || r.targetSchema === selectedSchema
)
```

#### Validation

Add a parser/graph fixture with a FK from `auth.users` to `public.profiles`, then verify selecting either schema still shows the relevant relationship.

---

### 3. Relationship model omits source/target schema names

Files:

- `src/lib/types.ts`
- `src/lib/parseSql.ts`
- `src/lib/graph.ts`
- `src/app/page.tsx`

`ParsedRelationship` stores table names but not schemas. This causes correctness issues for:

- Cross-schema relationships.
- Same table name in multiple schemas.
- Synthetic foreign node labels.
- Schema filtering.

#### Suggested type change

Update `src/lib/types.ts`:

```ts
export type ParsedRelationship = {
  id: string
  constraintName: string
  sourceSchema: string
  sourceTable: string
  sourceColumn: string
  targetSchema: string
  targetTable: string
  targetColumn: string
}
```

#### Suggested parser changes

When building inline relationships in `src/lib/parseSql.ts`, include source and target schema:

```ts
relationships.push({
  id: `${schema}.${table}.${colName}->${inlineRef.schema}.${inlineRef.table}.${inlineRef.columns[0]}_${nextRelId()}`,
  constraintName: `${table}_${colName}_fkey`,
  sourceSchema: schema,
  sourceTable: table,
  sourceColumn: colName,
  targetSchema: inlineRef.schema,
  targetTable: inlineRef.table,
  targetColumn: inlineRef.columns[0],
})
```

For table-level and `ALTER TABLE` relationships, include:

```ts
sourceSchema: schema,
targetSchema: refInfo.schema,
```

#### Suggested graph changes

Use schema-qualified node IDs to avoid collisions:

```ts
const getTableId = (schema: string, table: string) => `${schema}.${table}`
```

Build maps with schema-qualified keys:

```ts
const tableById = new Map<string, ParsedTable>()
const columnIdByTableId = new Map<string, Map<string, string>>()

for (const table of tables) {
  const tableId = getTableId(table.schema, table.name)
  tableById.set(tableId, table)
  const colMap = new Map<string, string>()
  for (const col of table.columns) {
    colMap.set(col.name, `${tableId}.${col.name}`)
  }
  columnIdByTableId.set(tableId, colMap)
}
```

Node IDs should also be schema-qualified:

```ts
id: getTableId(table.schema, table.name)
```

For React Flow edge source/target:

```ts
const sourceTableId = getTableId(rel.sourceSchema, rel.sourceTable)
const targetTableId = getTableId(rel.targetSchema, rel.targetTable)
```

#### Compatibility note

This is a behavioral change. It may require updating `findTable` and table selection to pass schema-qualified IDs or to resolve table names through a helper.

---

### 4. `parseSql.ts` is fragile and under-tested

File: `src/lib/parseSql.ts`

The parser uses broad casts like `Record<string, any>`, and Fallow reports `parseSql` as the highest-risk function:

- 194 lines
- Cyclomatic complexity: 75
- Cognitive complexity: 193
- CRAP estimate: 5700.0

#### Suggested testing setup

Add a lightweight test runner. Since the project already has TypeScript and `tsx`, either of these approaches is reasonable:

Option A — Vitest:

```sh
npm i -D vitest
```

`package.json`:

```json
"test": "vitest run"
```

Option B — Node test runner with `tsx`:

```json
"test": "tsx --test src/**/*.test.ts"
```

Vitest is more ergonomic for fixtures and assertions, so it is the preferred option.

#### Suggested first tests

Create `src/lib/parseSql.test.ts` with fixtures for:

1. Empty input.
2. Basic `CREATE TABLE public.users`.
3. Inline primary key.
4. Table-level primary key.
5. Inline foreign key.
6. Table-level foreign key.
7. `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`.
8. Nullable default behavior.
9. Defaults: string, boolean, number, function-like values.
10. Identity/serial columns.
11. Schema-qualified references.
12. Same table name in multiple schemas.

Example test shape:

```ts
import { describe, expect, it } from 'vitest'
import { parseSql } from './parseSql'

describe('parseSql', () => {
  it('parses schema-qualified foreign keys', () => {
    const schema = parseSql(`
      create table auth.users (
        id uuid primary key
      );

      create table public.profiles (
        id uuid primary key references auth.users(id)
      );
    `)

    expect(schema.tables).toHaveLength(2)
    expect(schema.relationships).toMatchObject([
      {
        sourceSchema: 'public',
        sourceTable: 'profiles',
        sourceColumn: 'id',
        targetSchema: 'auth',
        targetTable: 'users',
        targetColumn: 'id',
      },
    ])
  })
})
```

#### Suggested parser refactor after tests

After tests exist, split `parseSql` into smaller helpers:

- `parseStatements(sql: string): unknown[]`
- `parseCreateTableStatement(stmt): ParsedTable | null`
- `collectTableConstraints(createDefs): { pkColumns; uniqueColumns }`
- `parseColumnDefinition(def, constraintContext): ParsedColumn | null`
- `buildInlineRelationship(...)`
- `buildForeignKeyRelationshipsFromConstraint(...)`
- `parseCreateTableForeignKeys(stmt)`
- `parseAlterTableForeignKeys(stmt)`

This directly addresses Fallow duplication and complexity findings.

---

### 5. `isNotNull` default behavior is inconsistent

File: `src/lib/parseSql.ts`

Current code:

```ts
function isNotNull(definition: unknown): boolean {
  if (!definition || typeof definition !== 'object') return true // default to not null? Actually default is nullable unless specified. Keep false.
```

PostgreSQL columns are nullable unless `NOT NULL` is specified.

#### Suggested change

```ts
function isNotNull(definition: unknown): boolean {
  if (!definition || typeof definition !== 'object') return false
  const def = definition as Record<string, any>
  const nullable = def.nullable
  if (!nullable) return false
  if (typeof nullable === 'object') {
    const val = String(nullable.value ?? nullable.type ?? '').toLowerCase()
    return val === 'not null' || val === 'notnull'
  }
  return String(nullable).toLowerCase() === 'not null'
}
```

#### Add tests

```ts
it('treats columns as nullable by default', () => {
  const schema = parseSql('create table public.todos (title text);')
  expect(schema.tables[0].columns[0].isNullable).toBe(true)
})

it('recognizes not null columns', () => {
  const schema = parseSql('create table public.todos (title text not null);')
  expect(schema.tables[0].columns[0].isNullable).toBe(false)
})
```

---

## Medium-Priority Findings and Detailed Suggested Changes

### 6. Duplicate SQL serialization logic

Files:

- `src/components/SchemaGraphCanvas.tsx`
- `src/lib/utils.ts`

`SchemaGraphCanvas.tsx` duplicates SQL serialization despite `src/lib/utils.ts` exporting `tablesToSQL`.

#### Suggested change

Update import:

```ts
import { copyToClipboard, getSchemaAsMarkdown, tablesToSQL } from '@/lib/utils'
```

Replace `copyAsSQL` with:

```ts
const copyAsSQL = useCallback(() => {
  copyToClipboard(tablesToSQL(tables), () => toast.success('Schema SQL copied to clipboard'))
}, [tables])
```

#### Behavior change

Copied SQL will include `DEFAULT` and `GENERATED ALWAYS AS IDENTITY` because `tablesToSQL` already includes them.

---

### 7. Duplicate table node constants

Files:

- `src/lib/graph.ts`
- `src/components/TableNode.tsx`

#### Suggested change

Create `src/lib/constants.ts`:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

Update `src/lib/graph.ts`:

```ts
import { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH } from './constants'
```

Remove these exports from `graph.ts`:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

Update `src/components/TableNode.tsx`:

```ts
import { TABLE_NODE_WIDTH } from '@/lib/constants'
```

Remove local constants from `TableNode.tsx`.

#### Validation

Run:

```sh
npx fallow dead-code
npx tsc --noEmit
npm run build
```

---

### 8. Duplicate reference helper functions

File: `src/lib/parseSql.ts`

`getInlineReference` and `getTableLevelReference` are identical.

#### Suggested change

Replace both with:

```ts
function getReferenceInfo(definition: unknown): { schema: string; table: string; columns: string[] } | null {
  if (!definition || typeof definition !== 'object') return null
  const def = definition as Record<string, any>
  const ref = def.reference_definition
  if (!ref) return null

  const tableArr = Array.isArray(ref.table) ? ref.table : ref.table ? [ref.table] : []
  const tableInfo = tableArr[0]
  if (!tableInfo) return null

  const schemaName = typeof tableInfo.db === 'string' ? normalizeIdentifier(tableInfo.db) : 'public'
  const tableName = typeof tableInfo.table === 'string' ? normalizeIdentifier(tableInfo.table) : ''
  const columns = Array.isArray(ref.definition)
    ? ref.definition.map((col: unknown) => extractColumnName(col)).filter(Boolean)
    : []

  return { schema: schemaName, table: tableName, columns }
}
```

Then replace calls:

```ts
const inlineRef = getReferenceInfo(def)
const refInfo = getReferenceInfo(def)
const refInfo = getReferenceInfo(constraint)
```

---

### 9. Synthetic foreign node labels are confusing

File: `src/lib/graph.ts`

Current synthetic node data guesses schema with `rel.targetTable`.

#### Suggested change after relationship schemas exist

```ts
const targetTableId = getTableId(rel.targetSchema, rel.targetTable)

nodes.push({
  id: targetTableId,
  type: 'table',
  data: {
    id: targetTableId,
    schema: rel.targetSchema,
    name: rel.targetTable,
    comment: null,
    isForeign: true,
    columns: [],
  },
  position: { x: 0, y: 0 },
})
```

For an edge label:

```ts
data: {
  sourceName: rel.sourceTable,
  sourceSchemaName: rel.sourceSchema,
  sourceColumnName: rel.sourceColumn,
  targetName: rel.targetTable,
  targetSchemaName: rel.targetSchema,
  targetColumnName: rel.targetColumn,
}
```

---

### 10. `handleLoadExample` uses unnecessary `setTimeout`

File: `src/app/page.tsx`

#### Suggested change

```ts
const handleLoadExample = () => {
  setSql(SAMPLE_SCHEMA)
  setError(null)

  try {
    const parsed = parseSql(SAMPLE_SCHEMA)
    setSchema(parsed)
    const names = Array.from(new Set(parsed.tables.map((t) => t.schema))).sort()
    setSelectedSchema(names[0] ?? '')
    toast.success(`Loaded example schema: ${parsed.tables.length} tables`)
  } catch (err) {
    const message = formatParseError(err)
    setError(message)
    toast.error('Failed to parse example schema')
  }
}
```

---

### 11. Clipboard failures are silent

File: `src/lib/utils.ts`

#### Suggested change

Return a success boolean:

```ts
export async function copyToClipboard(text: string, onSuccess?: () => void): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    onSuccess?.()
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}
```

At call sites that need user feedback:

```ts
const ok = await copyToClipboard(text, () => toast.success('Copied'))
if (!ok) toast.error('Failed to copy to clipboard')
```

Because existing call sites are synchronous event handlers, either make them `async` or keep the helper’s current fire-and-forget style and add an optional `onError` callback:

```ts
export async function copyToClipboard(
  text: string,
  onSuccess?: () => void,
  onError?: (error: unknown) => void
) {
  try {
    await navigator.clipboard.writeText(text)
    onSuccess?.()
  } catch (err) {
    console.error('Failed to copy:', err)
    onError?.(err)
  }
}
```

---

### 12. Export-to-image implementation needs verification

File: `src/components/useExportSchemaToImage.ts`

#### Suggested changes

1. Verify the installed `html-to-image` options against its package docs/types.
2. Add a manual QA checklist for PNG/SVG export:
   - Light mode.
   - Dark mode.
   - Zoomed in.
   - Zoomed out.
   - Panned canvas.
   - Large schema.
3. Consider exporting from a normalized off-screen graph rather than the live `.react-flow__viewport`.

#### Safer short-term improvement

Add explicit failure context:

```ts
const message = error instanceof Error ? error.message : 'Unknown export error'
toast.error(`Failed to download ${format.toUpperCase()}: ${message}`)
```

---

## Low-Priority Cleanup and Detailed Suggested Changes

### 13. Remove unused `ToolbarAction`

File: `src/lib/types.ts`

Remove:

```ts
export type ToolbarAction =
  | 'copy-sql'
  | 'copy-markdown'
  | 'download-png'
  | 'download-svg'
  | 'auto-layout'
  | 'find-table'
  | 'reset-sql'
  | 'load-example'
```

### 14. Replace boilerplate README

File: `README.md`

Suggested contents:

- What the app does.
- Supported stack and commands.
- Supported SQL features.
- Known limitations.
- Development workflow.
- Link to `AUDIT.md`, `fallow.md`, and `gpt5.5-report.md`.

This has been updated in this pass.

### 15. Remove unused public assets

Files likely removable if unreferenced:

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

Before deletion, confirm with:

```sh
grep -R "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" -n src public README.md
```

### 16. Extract toolbar button styling

File: `src/components/Toolbar.tsx`

Suggested local constant:

```ts
const toolbarButtonClass =
  'flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
```

Then use:

```tsx
className={toolbarButtonClass}
```

A reusable `ToolbarButton` component is also reasonable, but a constant is enough for now.

### 17. Move `Toaster` only if the app grows

File: `src/app/page.tsx`

The current placement works for a single page. If more routes are added, move:

```tsx
<Toaster position="top-center" richColors />
```

to `src/app/layout.tsx`.

### 18. Add error boundary

Suggested App Router file: `src/app/error.tsx`

```tsx
'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-lg text-sm text-zinc-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </main>
  )
}
```

## Tooling Suggested Changes

### Add typecheck script

File: `package.json`

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit"
}
```

### Add ESLint for Next.js 16

Install:

```sh
npm i -D eslint eslint-config-next
```

Add script:

```json
"lint": "eslint ."
```

Create `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

Do not use `next lint`; it is removed in Next.js 16.

### Add parser tests

Preferred:

```sh
npm i -D vitest
```

`package.json`:

```json
"test": "vitest run"
```

Optional watch script:

```json
"test:watch": "vitest"
```

## Suggested Implementation Phases

### Phase 0 — Compliance and docs

Goal: reduce immediate non-code risk.

1. Remove React Flow `hideAttribution`.
2. Replace boilerplate README.
3. Add `typecheck` script.

Validation:

```sh
npm run typecheck
npm run build
```

### Phase 1 — Safe Fallow cleanup

Goal: reduce dead exports and duplication without changing parser behavior.

1. Create `src/lib/constants.ts`.
2. Move table constants there.
3. Make `SchemaGraphCanvas.tsx` use `tablesToSQL`.
4. Remove `ToolbarAction`.
5. Remove internal-only exports.
6. Extract toolbar button class constant.

Validation:

```sh
npx fallow dead-code
npx tsc --noEmit
npm run build
```

### Phase 2 — Testing foundation

Goal: protect parser behavior before refactor.

1. Add Vitest.
2. Add parser fixture tests.
3. Add tests for nullable/default/identity/FK behavior.
4. Add multi-schema FK tests.

Validation:

```sh
npm run test
npm run typecheck
npm run build
```

### Phase 3 — Schema-qualified relationships

Goal: fix the biggest correctness issue.

1. Add `sourceSchema` and `targetSchema` to `ParsedRelationship`.
2. Update all relationship builders in `parseSql.ts`.
3. Use schema-qualified table IDs in `graph.ts`.
4. Update `page.tsx` relationship filtering.
5. Update `findTable` to handle schema-qualified IDs.
6. Fix synthetic foreign node labels.

Validation:

```sh
npm run test
npm run typecheck
npm run build
```

Manual validation:

- Render sample schema.
- Render schema with `auth.users` referenced by `public.profiles`.
- Select each schema and verify relationships remain visible where expected.

### Phase 4 — Parser refactor

Goal: reduce Fallow complexity findings.

1. Merge `getInlineReference` and `getTableLevelReference`.
2. Extract FK relationship builder.
3. Split `parseSql` into statement-specific helpers.
4. Replace `Record<string, any>` with helper type guards where practical.

Validation:

```sh
npm run test
npx fallow health
npm run build
```

### Phase 5 — UX hardening

Goal: improve production polish.

1. Add `src/app/error.tsx`.
2. Improve clipboard error reporting.
3. Improve export-to-image error messages.
4. Document export limitations.
5. Remove unused public assets.

## Overall Assessment

The codebase is in a good state for a small prototype and currently passes type checking and production build. The next best improvements are not broad rewrites; they are targeted correctness and confidence work. Remove the React Flow attribution override first, then take the Fallow cleanup wins, then add parser tests before changing the relationship model and parser internals.
