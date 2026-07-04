# Fallow Report and Remediation Plan

Generated: 2026-06-23  
Tool: `bunx fallow` (`fallow@2.101.0`)  
Project: `schema-visualizer`

## Commands Run

Per the Fallow quickstart, these commands were run from the project root:

```sh
bunx fallow
bunx fallow dead-code
bunx fallow dupes
bunx fallow health
bunx fallow fix --dry-run
```

The commands intentionally exited non-zero because Fallow found dead-code, duplication, and health findings. No source files were modified.

## Overall Summary

Fallow summary from the full run:

- Files analyzed: 18
- Entry points detected: 3 plugin-detected entry points
- LOC: 1,961
- Dead files: 0.0% (`0 of 18`)
- Dead exports: 21.1% (`8 of 38`)
- Average cyclomatic complexity: 3.4
- P90 cyclomatic complexity: 8
- Maintainability index: 89.0, rated good
- Health score: 82, grade B
- Duplication: 52 lines, 2.8%, across 1 file
- Refactoring targets: 3 medium-priority targets

Fallow’s suggested next command:

```sh
bunx fallow dead-code --trace src/components/SchemaGraphContext.tsx:SchemaGraphContext
```

## Dead Code Findings

Command:

```sh
bunx fallow dead-code
```

### Unused Exports

| File | Line | Export | Suggested action |
|---|---:|---|---|
| `src/components/TableNode.tsx` | 12 | `TABLE_NODE_WIDTH` | Move to `src/lib/constants.ts`; import locally without exporting from component. |
| `src/components/TableNode.tsx` | 13 | `TABLE_NODE_ROW_HEIGHT` | Remove from component; currently unused there. |
| `src/lib/graph.ts` | 7 | `TABLE_NODE_WIDTH` | Move to `src/lib/constants.ts`; import into graph. |
| `src/lib/graph.ts` | 8 | `TABLE_NODE_ROW_HEIGHT` | Move to `src/lib/constants.ts`; import into graph. |
| `src/lib/utils.ts` | 26 | `getTableDefinitionAsMarkdown` | Remove `export`; keep as internal helper. |
| `src/lib/utils.ts` | 84 | `tablesToSQL` | Keep exported, but make `SchemaGraphCanvas.tsx` use it. |
| `src/components/SchemaGraphContext.tsx` | 11 | `SchemaGraphContext` | Remove `export` if only provider/hook are public. |

### Unused Type Export

| File | Line | Type Export | Suggested action |
|---|---:|---|---|
| `src/lib/types.ts` | 60 | `ToolbarAction` | Remove unless a future toolbar reducer/API will use it soon. |

### Duplicate Exports

| File A | File B | Duplicate exports | Suggested action |
|---|---|---|---|
| `src/components/TableNode.tsx` | `src/lib/graph.ts` | `TABLE_NODE_ROW_HEIGHT`, `TABLE_NODE_WIDTH` | Centralize in `src/lib/constants.ts`. |

## Detailed Dead-Code Remediation

### 1. Centralize table layout constants

Create `src/lib/constants.ts`:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

Update `src/lib/graph.ts`:

```ts
import { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH } from './constants'
```

Delete from `src/lib/graph.ts`:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

Update `src/components/TableNode.tsx`:

```ts
import { TABLE_NODE_WIDTH } from '@/lib/constants'
```

Delete local `TABLE_NODE_WIDTH` and `TABLE_NODE_ROW_HEIGHT` from `TableNode.tsx`.

### 2. Use the shared SQL serializer

Update `src/components/SchemaGraphCanvas.tsx` import:

```ts
import { copyToClipboard, getSchemaAsMarkdown, tablesToSQL } from '@/lib/utils'
```

Replace `copyAsSQL` with:

```ts
const copyAsSQL = useCallback(() => {
  copyToClipboard(tablesToSQL(tables), () => toast.success('Schema SQL copied to clipboard'))
}, [tables])
```

This intentionally changes copied SQL to include `DEFAULT` and `GENERATED ALWAYS AS IDENTITY` clauses.

### 3. Remove internal-only exports

In `src/components/SchemaGraphContext.tsx`, change:

```ts
export const SchemaGraphContext = createContext<...>(...)
```

to:

```ts
const SchemaGraphContext = createContext<...>(...)
```

In `src/lib/utils.ts`, change:

```ts
export function getTableDefinitionAsMarkdown(...)
```

to:

```ts
function getTableDefinitionAsMarkdown(...)
```

### 4. Remove unused type export

Delete `ToolbarAction` from `src/lib/types.ts`.

## Duplication Findings

Command:

```sh
bunx fallow dupes
```

Fallow found 2 clone groups, both in `src/lib/parseSql.ts`.

| Clone ID | Lines | Instances | Suggested action |
|---|---:|---|---|
| `dup:e1014e9c` | 20 lines | `src/lib/parseSql.ts:314-333` and `src/lib/parseSql.ts:357-376` | Extract shared FK relationship builder. |
| `dup:e3799a20` | 6 lines | `src/lib/parseSql.ts:213-218` and `src/lib/parseSql.ts:297-302` | Extract `isCreateTableStatement` / `getCreateTableContext` helper. |

Fallow also grouped these into 1 clone family:

- 2 groups
- 26 lines across `src/lib/parseSql.ts`
- Suggested action: extract shared functions from `parseSql.ts`

## Detailed Duplication Remediation

Do this after parser tests exist.

Suggested helpers:

```ts
function getCreateTableContext(stmt: unknown): {
  schema: string
  table: string
  createDefs: unknown[]
} | null {
  if (!stmt || typeof stmt !== 'object') return null
  const s = stmt as Record<string, any>
  if (s.type !== 'create' || String(s.keyword).toLowerCase() !== 'table') return null

  const { schema, table } = getTableNameFromAst(s.table)
  const createDefs = Array.isArray(s.create_definitions) ? s.create_definitions : []
  return { schema, table, createDefs }
}
```

And:

```ts
function buildForeignKeyRelationships({
  schema,
  table,
  constraint,
  idSuffix,
  nextRelId,
}: {
  schema: string
  table: string
  constraint: Record<string, any>
  idSuffix: string
  nextRelId: () => number
}): ParsedRelationship[] {
  const constraintName =
    typeof constraint.constraint === 'string' ? normalizeIdentifier(constraint.constraint) : `${table}_fkey`
  const sourceCols = extractConstraintColumns(constraint.definition)
  const refInfo = getReferenceInfo(constraint)

  if (!refInfo || !refInfo.table || sourceCols.length === 0 || refInfo.columns.length === 0) return []

  return sourceCols.flatMap((sourceCol, i) => {
    const targetCol = refInfo.columns[i]
    if (!sourceCol || !targetCol) return []

    return [{
      id: `${constraintName}_${sourceCol}_${i}${idSuffix}_${nextRelId()}`,
      constraintName,
      sourceSchema: schema,
      sourceTable: table,
      sourceColumn: sourceCol,
      targetSchema: refInfo.schema,
      targetTable: refInfo.table,
      targetColumn: targetCol,
    }]
  })
}
```

This helper assumes the recommended `ParsedRelationship` schema fields have been added.

## Health Findings

Command:

```sh
bunx fallow health
```

### Health Score

- Health score: 82 B
- Deductions:
  - Unit size: `-10.0`
  - Dead exports: `-4.2`
  - Complexity: `-3.6`

### Large Functions

| File | Line | Function | Lines | Suggested action |
|---|---:|---|---:|---|
| `src/lib/parseSql.ts` | 188 | `parseSql` | 194 | Split into statement parsing helpers after tests. |
| `src/components/SchemaGraphCanvas.tsx` | 31 | `SchemaGraphCanvas` | 188 | Extract toolbar callbacks/export logic later; not urgent. |
| `src/app/page.tsx` | 14 | `Home` | 164 | Extract schema filtering and example loading helpers later. |
| `src/components/TableNode.tsx` | 17 | `TableNodeComponent` | 141 | Extract `ColumnRow` subcomponent. |
| `src/lib/graph.ts` | 13 | `getGraphDataFromTables` | 126 | Split node building, edge building, synthetic node handling. |
| `src/components/DefaultEdge.tsx` | 77 | `EdgeRelationInfo` | 85 | Extract collision-check hook if this grows. |
| `src/components/TableNode.tsx` | 78 | inline arrow | 77 | Extract `ColumnRow`. |
| `src/components/Toolbar.tsx` | 21 | `Toolbar` | 77 | Extract `ToolbarButton` or button class constant. |

### Highest-Complexity Functions

| File | Line | Function | Severity | Cyclomatic | Cognitive | Lines | CRAP | Suggested action |
|---|---:|---|---|---:|---:|---:|---:|---|
| `src/lib/parseSql.ts` | 188 | `parseSql` | CRITICAL | 75 | 193 | 194 | 5700.0 | Add tests, then split by statement type. |
| `src/lib/parseSql.ts` | 60 | `extractDefaultValue` | CRITICAL | 18 | 14 | 30 | 342.0 | Add fixture tests; simplify unwrapping branches. |
| `src/components/TableNode.tsx` | 78 | inline arrow | CRITICAL | 12 | 9 | 77 | 156.0 | Extract `ColumnRow`. |
| `src/lib/graph.ts` | 13 | `getGraphDataFromTables` | CRITICAL | 11 | 17 | 126 | 132.0 | Split graph construction into helpers. |
| `src/lib/parseSql.ts` | 23 | `parseDataType` | CRITICAL | 11 | 12 | 24 | 132.0 | Add tests for numeric/string/array lengths, then simplify. |
| `src/lib/parseSql.ts` | 127 | `getInlineReference` | CRITICAL | 10 | 10 | 18 | 110.0 | Merge with `getTableLevelReference`. |
| `src/lib/parseSql.ts` | 146 | `getTableLevelReference` | CRITICAL | 10 | 10 | 18 | 110.0 | Merge with `getInlineReference`. |
| `src/components/Toolbar.tsx` | 21 | `Toolbar` | CRITICAL | 10 | 15 | 77 | 110.0 | Extract button primitive/constant. |

## Fallow Refactoring Targets

Fallow reported 3 medium refactoring targets:

| Score | Priority | File | Category | Recommendation |
|---:|---:|---|---|---|
| 12.3 | 24.5 | `src/components/TableNode.tsx` | dead code | Remove 2 unused exports to reduce surface area. |
| 9.1 | 18.2 | `src/lib/parseSql.ts` | complexity | Extract `parseSql` into smaller functions. |
| 8.7 | 17.4 | `src/lib/graph.ts` | dead code | Remove 2 unused exports to reduce surface area. |

## Fix Preview

Command:

```sh
bunx fallow fix --dry-run
```

No files were modified. Fallow would remove these exports:

| File | Line | Export | Apply automatically? |
|---|---:|---|---|
| `src/components/SchemaGraphContext.tsx` | 11 | `SchemaGraphContext` | Safe after confirming no direct imports. |
| `src/lib/graph.ts` | 8 | `TABLE_NODE_ROW_HEIGHT` | Prefer constants module instead of blind removal. |
| `src/lib/graph.ts` | 7 | `TABLE_NODE_WIDTH` | Prefer constants module instead of blind removal. |
| `src/lib/utils.ts` | 84 | `tablesToSQL` | Do not remove; use it from `SchemaGraphCanvas.tsx`. |
| `src/lib/utils.ts` | 26 | `getTableDefinitionAsMarkdown` | Safe to unexport, not delete. |
| `src/components/TableNode.tsx` | 13 | `TABLE_NODE_ROW_HEIGHT` | Safe to delete from component. |
| `src/components/TableNode.tsx` | 12 | `TABLE_NODE_WIDTH` | Replace with constants import. |

Fallow would also create `.fallowrc.json` with `ignoreExports` rules for:

- `src/components/TableNode.tsx`
- `src/lib/graph.ts`

Do not apply that config blindly; the better fix is to remove/centralize the exports.

## Recommended Action Plan

1. Remove React Flow `hideAttribution` first for license compliance.
2. Add or use a `typecheck` script so validation is repeatable.
3. Apply safe dead-code cleanup:
   - constants module,
   - internal-only exports,
   - remove `ToolbarAction`,
   - use `tablesToSQL` from the canvas.
4. Re-run Fallow and TypeScript:

```sh
bunx fallow dead-code
bunx tsc --noEmit
bun run build
```

5. Add parser tests.
6. Add schema fields to `ParsedRelationship` and update graph IDs/filtering.
7. Refactor `parseSql.ts` duplication and complexity.
8. Re-run full validation:

```sh
bunx fallow
bunx tsc --noEmit
bun run build
```

## Notes

- Fallow reported 0 dead files, so there is no immediate file deletion candidate from static analysis.
- The top maintainability concern is `src/lib/parseSql.ts`, but it should not be aggressively refactored without tests because it depends on fragile `node-sql-parser` AST shapes.
- The easiest safe wins are unused exports/types and duplicated constants.
