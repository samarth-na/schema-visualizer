# Schema Visualizer — Codebase Audit

Updated: 2026-06-23  
Stack: Next.js 16.2.9 App Router, React 19.2.4, Tailwind 4, `@xyflow/react` 12, `@dagrejs/dagre`, `node-sql-parser` 5.4.0  
Related docs: `gpt5.5-report.md`, `fallow.md`, `PHASE1_PLAN.md`, `test.md`

## Executive Summary

The project is a compact single-page schema visualizer that parses PostgreSQL DDL and renders an ER diagram. It currently passes TypeScript and production build validation, and the codebase has a clear split between UI components and pure logic.

The highest-priority work is correctness and confidence:

1. Fix React Flow attribution/license compliance.
2. Fix multi-schema relationship handling.
3. Add parser regression tests before refactoring `parseSql.ts`.
4. Remove dead exports/duplicate constants reported by Fallow.
5. Reduce parser duplication and complexity after tests exist.

## Validation Snapshot

Commands run during review:

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed |
| `npx fallow` | Ran; findings detected |
| `npx fallow dead-code` | Ran; unused exports/types and duplicate exports detected |
| `npx fallow dupes` | Ran; duplicate blocks detected in `src/lib/parseSql.ts` |
| `npx fallow health` | Ran; health score `82 B` |
| `npx fallow fix --dry-run` | Ran; preview only, no files modified |

Fallow summary:

- 18 files analyzed
- 1,961 LOC
- Dead files: 0.0%
- Dead exports: 21.1% (`8 of 38`)
- Duplication: 52 lines, 2.8%
- Maintainability index: 89.0, good
- Health score: 82 B

## 1. Cleanliness

### Strengths

- Clear separation between `src/lib/` pure logic and `src/components/` UI.
- Shared domain types are centralized in `src/lib/types.ts`.
- `@/*` path alias is used consistently.
- `SchemaGraphCanvas.tsx` memoizes `nodeTypes` and `edgeTypes`, avoiding React Flow remount churn.
- `TableNode` is memoized with a custom comparator.
- `README.md` has now been replaced with project-specific documentation rather than create-next-app boilerplate.

### Issues and Suggested Changes

#### `parseSql.ts` relies heavily on `Record<string, any>`

File: `src/lib/parseSql.ts`

The parser casts many AST objects to `Record<string, any>`. This is the biggest static-safety gap because `node-sql-parser` AST shapes can vary by version and by SQL construct.

Suggested approach:

1. Add parser tests first. See `test.md`.
2. Add narrow helper guards such as:

```ts
type SqlAstRecord = Record<string, unknown>

function isRecord(value: unknown): value is SqlAstRecord {
  return value !== null && typeof value === 'object'
}
```

3. Replace broad `Record<string, any>` casts incrementally.
4. Keep untyped parser details inside parser helpers rather than leaking them into graph/UI code.

#### Duplicate reference helpers

File: `src/lib/parseSql.ts`

`getInlineReference` and `getTableLevelReference` are identical. Replace them with one `getReferenceInfo` helper after parser tests are in place.

Suggested helper:

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

#### Toolbar button classes are duplicated

File: `src/components/Toolbar.tsx`

The same button class string is repeated across toolbar buttons.

Minimal cleanup:

```ts
const toolbarButtonClass =
  'flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
```

Use `className={toolbarButtonClass}` for all toolbar buttons.

## 2. Bloat / Dead Code

Fallow reported 7 unused value exports, 1 unused type export, and 1 duplicate-export pair.

### Unused exports

| File | Export | Suggested action |
|---|---|---|
| `src/components/TableNode.tsx` | `TABLE_NODE_WIDTH` | Move to `src/lib/constants.ts`; import locally. |
| `src/components/TableNode.tsx` | `TABLE_NODE_ROW_HEIGHT` | Remove from component; unused there. |
| `src/lib/graph.ts` | `TABLE_NODE_WIDTH` | Move to `src/lib/constants.ts`. |
| `src/lib/graph.ts` | `TABLE_NODE_ROW_HEIGHT` | Move to `src/lib/constants.ts`. |
| `src/lib/utils.ts` | `getTableDefinitionAsMarkdown` | Remove `export`; keep internal. |
| `src/lib/utils.ts` | `tablesToSQL` | Keep exported; use it in `SchemaGraphCanvas.tsx`. |
| `src/components/SchemaGraphContext.tsx` | `SchemaGraphContext` | Remove `export`; keep provider/hook exported. |

### Unused type export

| File | Export | Suggested action |
|---|---|---|
| `src/lib/types.ts` | `ToolbarAction` | Delete unless a toolbar reducer/API is imminent. |

### Duplicate table constants

Files:

- `src/components/TableNode.tsx`
- `src/lib/graph.ts`

Create `src/lib/constants.ts`:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

Then import where needed.

### Duplicate SQL serialization

Files:

- `src/components/SchemaGraphCanvas.tsx`
- `src/lib/utils.ts`

`SchemaGraphCanvas.tsx` has inline SQL generation while `tablesToSQL` exists. Replace the inline implementation with:

```ts
const copyAsSQL = useCallback(() => {
  copyToClipboard(tablesToSQL(tables), () => toast.success('Schema SQL copied to clipboard'))
}, [tables])
```

This intentionally changes copied SQL to include defaults and identity columns.

## 3. Performance

### Graph rebuilds and `fitView`

File: `src/components/SchemaGraphCanvas.tsx`

The canvas rebuilds nodes/edges and calls `fitView` whenever `tables`, `relationships`, or `selectedSchemaName` identity changes. This is acceptable for the current paste-and-render workflow, but could become disruptive with large schemas or frequent state updates.

Suggested later improvements:

- Avoid rebuilding graph data if the parsed schema has not changed.
- Do not auto-fit while the user is actively panning/zooming.
- Add an explicit “fit view” action only after initial render or schema change.

### Edge animation updates are O(edges)

File: `src/components/SchemaGraphCanvas.tsx`

`handleSelectionChange` maps all edges on every selection event. This is tolerable for small diagrams but can stall large schemas.

Suggested later improvements:

- Keep selected node IDs in component state and let `DefaultEdge` derive selected styling.
- Avoid rewriting all edge objects on every selection tick.

### Synthetic node lookup is O(nodes) per missing target

File: `src/lib/graph.ts`

Current code uses `nodes.some(...)` inside the relationship loop. Use a `Set` of node IDs instead.

```ts
const nodeIds = new Set(nodes.map((node) => node.id))

if (!nodeIds.has(targetId)) {
  nodeIds.add(targetId)
  nodes.push(...)
}
```

This should be folded into the schema-qualified graph refactor.

## 4. Correctness / Bugs

### React Flow attribution is hidden

File: `src/components/SchemaGraphCanvas.tsx`

```tsx
proOptions={{ hideAttribution: true }}
```

Remove this unless the project has a paid React Flow Pro entitlement.

This is the top compliance issue and should be fixed before public deployment.

### Cross-schema relationship filtering is incorrect

File: `src/app/page.tsx`

Current filter only checks `sourceTable`. Minimal fix:

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

Long-term fix: add `sourceSchema` and `targetSchema` to `ParsedRelationship` and filter by those fields.

### Relationship model omits schema names

File: `src/lib/types.ts`

Current `ParsedRelationship` cannot distinguish same-named tables across schemas. Update it to:

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

Then update `parseSql.ts`, `graph.ts`, and `page.tsx` accordingly.

### `isNotNull` default is wrong

File: `src/lib/parseSql.ts`

Current early return should be changed from `true` to `false`:

```ts
if (!definition || typeof definition !== 'object') return false
```

Add tests for default nullable behavior and explicit `NOT NULL`.

### `handleLoadExample` uses unnecessary `setTimeout`

File: `src/app/page.tsx`

Replace with synchronous parsing:

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

### Synthetic foreign node labels are confusing

File: `src/lib/graph.ts`

The current fallback uses `rel.targetTable` as schema. Once relationship schemas exist, synthetic nodes should use `rel.targetSchema` and `rel.targetTable` separately.

## 5. Tooling

### Add scripts

File: `package.json`

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### ESLint for Next.js 16

Install:

```sh
npm i -D eslint eslint-config-next
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

Do not use `next lint`; it was removed in Next.js 16.

### Tests

Use `test.md` as the implementation plan. Parser tests should land before major parser refactors.

## 6. Documentation / Assets

### README

`README.md` has been updated to describe the actual app, stack, commands, limitations, and report links.

### Public assets

Likely removable if unreferenced:

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

Confirm before deleting:

```sh
grep -R "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" -n src public README.md
```

## 7. Prioritized Fix Order

| Priority | Item | Why | Suggested phase |
|---:|---|---|---|
| 1 | Remove React Flow `hideAttribution` | License/compliance | Phase 0 |
| 2 | Add `typecheck` script | Repeatable validation | Phase 0 |
| 3 | Apply safe Fallow cleanup | Low-risk maintainability | Phase 1 |
| 4 | Add parser tests | Protect fragile parser | Phase 2 |
| 5 | Add relationship schema fields | Fix multi-schema correctness | Phase 3 |
| 6 | Fix selected-schema relationship filtering | Correctness | Phase 3 |
| 7 | Fix `isNotNull` default | Correctness | Phase 3 or earlier with tests |
| 8 | Refactor parser duplication | Reduce Fallow complexity/dupes | Phase 4 |
| 9 | Add error boundary and clipboard/export error UX | Production polish | Phase 5 |
| 10 | Remove unused public assets | Cleanup | Phase 5 |

## 8. Recommended Validation After Changes

For cleanup-only changes:

```sh
npx fallow dead-code
npx tsc --noEmit
npm run build
```

For parser or graph behavior changes:

```sh
npm run test
npx tsc --noEmit
npm run build
```

For final full validation:

```sh
npx fallow
npm run test
npm run typecheck
npm run lint
npm run build
```

If `lint`, `test`, or `typecheck` scripts do not exist yet, use the direct commands described above.
