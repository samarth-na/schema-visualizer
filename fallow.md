# Fallow Report

Generated: 2026-06-23  
Tool: `npx fallow` (`fallow@2.101.0` installed by `npx`)  
Project: `schema-visualizer`

## Commands Run

Per the Fallow quickstart, these commands were run from the project root:

```sh
npx fallow
npx fallow dead-code
npx fallow dupes
npx fallow health
npx fallow fix --dry-run
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
fallow dead-code --trace src/components/SchemaGraphContext.tsx:SchemaGraphContext
```

## Dead Code Findings

Command:

```sh
npx fallow dead-code
```

### Unused Exports

Fallow found 7 unused value exports:

| File | Line | Export |
|---|---:|---|
| `src/components/TableNode.tsx` | 12 | `TABLE_NODE_WIDTH` |
| `src/components/TableNode.tsx` | 13 | `TABLE_NODE_ROW_HEIGHT` |
| `src/lib/graph.ts` | 7 | `TABLE_NODE_WIDTH` |
| `src/lib/graph.ts` | 8 | `TABLE_NODE_ROW_HEIGHT` |
| `src/lib/utils.ts` | 26 | `getTableDefinitionAsMarkdown` |
| `src/lib/utils.ts` | 84 | `tablesToSQL` |
| `src/components/SchemaGraphContext.tsx` | 11 | `SchemaGraphContext` |

### Unused Type Exports

Fallow found 1 unused type export:

| File | Line | Type Export |
|---|---:|---|
| `src/lib/types.ts` | 60 | `ToolbarAction` |

### Duplicate Exports

Fallow found duplicate exports between:

| File A | File B | Duplicate exports |
|---|---|---|
| `src/components/TableNode.tsx` | `src/lib/graph.ts` | `TABLE_NODE_ROW_HEIGHT`, `TABLE_NODE_WIDTH` |

### Dead Code Interpretation

Recommended cleanup order:

1. Remove `export` from `SchemaGraphContext` if it is only used internally by `SchemaGraphContextProvider` and `useSchemaGraphContext`.
2. Centralize `TABLE_NODE_WIDTH` and `TABLE_NODE_ROW_HEIGHT` in one constants module, then import them where needed.
3. Remove `ToolbarAction` if it is not part of a planned public API.
4. Make `SchemaGraphCanvas.tsx` call `tablesToSQL(tables)` instead of duplicating SQL serialization; that will turn `tablesToSQL` from unused into used.
5. Remove the `export` from `getTableDefinitionAsMarkdown` if it is only called by `getSchemaAsMarkdown`.

## Duplication Findings

Command:

```sh
npx fallow dupes
```

Fallow found 2 clone groups, both in `src/lib/parseSql.ts`.

| Clone ID | Lines | Instances |
|---|---:|---|
| `dup:e1014e9c` | 20 lines | `src/lib/parseSql.ts:314-333` and `src/lib/parseSql.ts:357-376` |
| `dup:e3799a20` | 6 lines | `src/lib/parseSql.ts:213-218` and `src/lib/parseSql.ts:297-302` |

Fallow also grouped these into 1 clone family:

- 2 groups
- 26 lines across `src/lib/parseSql.ts`
- Suggested action: extract shared functions from `parseSql.ts`

### Duplication Interpretation

The main duplicated block is the relationship-building loop for table-level `CREATE TABLE` constraints and `ALTER TABLE ... ADD FOREIGN KEY`. Refactoring this into a shared helper would reduce duplication and make future schema-aware relationship changes easier.

Suggested helper candidates:

- A function to normalize statement/table context.
- A function to build one or more `ParsedRelationship` objects from a foreign-key constraint.

This should ideally happen after adding parser regression tests, because `parseSql.ts` is the codebase’s highest-risk file.

## Health Findings

Command:

```sh
npx fallow health
```

### Health Score

Fallow reported:

- Health score: 82 B
- Deductions:
  - Unit size: `-10.0`
  - Dead exports: `-4.2`
  - Complexity: `-3.6`

### Function Size Distribution

- Low: 74%
- Medium: 11%
- High: 7%
- Very high: 7%

### Large Functions

Fallow found 8 functions over 60 lines:

| File | Line | Function | Lines |
|---|---:|---|---:|
| `src/lib/parseSql.ts` | 188 | `parseSql` | 194 |
| `src/components/SchemaGraphCanvas.tsx` | 31 | `SchemaGraphCanvas` | 188 |
| `src/app/page.tsx` | 14 | `Home` | 164 |
| `src/components/TableNode.tsx` | 17 | `TableNodeComponent` | 141 |
| `src/lib/graph.ts` | 13 | `getGraphDataFromTables` | 126 |
| `src/components/DefaultEdge.tsx` | 77 | `EdgeRelationInfo` | 85 |
| `src/components/TableNode.tsx` | 78 | inline arrow | 77 |
| `src/components/Toolbar.tsx` | 21 | `Toolbar` | 77 |

### High Complexity Functions

Fallow found 20 functions above complexity thresholds. Highest-risk entries:

| File | Line | Function | Severity | Cyclomatic | Cognitive | Lines | CRAP |
|---|---:|---|---|---:|---:|---:|---:|
| `src/lib/parseSql.ts` | 188 | `parseSql` | CRITICAL | 75 | 193 | 194 | 5700.0 |
| `src/lib/parseSql.ts` | 60 | `extractDefaultValue` | CRITICAL | 18 | 14 | 30 | 342.0 |
| `src/components/TableNode.tsx` | 78 | inline arrow | CRITICAL | 12 | 9 | 77 | 156.0 |
| `src/lib/graph.ts` | 13 | `getGraphDataFromTables` | CRITICAL | 11 | 17 | 126 | 132.0 |
| `src/lib/parseSql.ts` | 23 | `parseDataType` | CRITICAL | 11 | 12 | 24 | 132.0 |
| `src/lib/parseSql.ts` | 127 | `getInlineReference` | CRITICAL | 10 | 10 | 18 | 110.0 |
| `src/lib/parseSql.ts` | 146 | `getTableLevelReference` | CRITICAL | 10 | 10 | 18 | 110.0 |
| `src/components/Toolbar.tsx` | 21 | `Toolbar` | CRITICAL | 10 | 15 | 77 | 110.0 |
| `src/components/DefaultEdge.tsx` | 19 | `DefaultEdgeComponent` | HIGH | 9 | 17 | 55 | 90.0 |
| `src/lib/parseSql.ts` | 100 | `isIdentity` | HIGH | 9 | 7 | 8 | 90.0 |
| `src/components/TableNode.tsx` | 17 | `TableNodeComponent` | HIGH | 9 | 8 | 141 | 90.0 |
| `src/lib/parseSql.ts` | 48 | `isNotNull` | HIGH | 8 | 6 | 11 | 72.0 |
| `src/lib/parseSql.ts` | 7 | `extractColumnName` | HIGH | 7 | 5 | 15 | 56.0 |
| `src/lib/parseSql.ts` | 170 | `getTableNameFromAst` | HIGH | 7 | 7 | 10 | 56.0 |

Other reported functions above threshold:

- `src/lib/parseSql.ts:91` `extractComment`
- `src/lib/utils.ts:88` `cols`
- `src/app/page.tsx:14` `Home`
- `src/lib/utils.ts:46` inline arrow
- `src/components/DefaultEdge.tsx:99` `checkIfShouldBeDisplayed`
- `src/components/useExportSchemaToImage.ts:64` `getAllPropertyNames`

### File Health Scores

Fallow sorted these files by triage concern:

| Score | File | Signal |
|---:|---|---|
| 83.1 | `src/lib/parseSql.ts` | risk, `>999` risk |
| 76.3 | `src/components/TableNode.tsx` | risk, 67% dead, 156.0 risk |
| 83.9 | `src/lib/graph.ts` | risk, 50% dead, 132.0 risk |
| 91.1 | `src/components/Toolbar.tsx` | risk, 110.0 risk |
| 91.5 | `src/components/DefaultEdge.tsx` | risk, 90.0 risk |
| 82.9 | `src/lib/utils.ts` | risk, 40% dead, 42.0 risk |
| 88.0 | `src/app/page.tsx` | risk, 42.0 risk |
| 96.1 | `src/components/useExportSchemaToImage.ts` | risk, 30.0 risk |
| 85.7 | `src/components/SchemaGraphCanvas.tsx` | risk, 20.0 risk |
| 91.1 | `src/components/FindTableSelector.tsx` | risk, 20.0 risk |

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
npx fallow fix --dry-run
```

No files were modified. Fallow would remove these exports:

| File | Line | Export |
|---|---:|---|
| `src/components/SchemaGraphContext.tsx` | 11 | `SchemaGraphContext` |
| `src/lib/graph.ts` | 8 | `TABLE_NODE_ROW_HEIGHT` |
| `src/lib/graph.ts` | 7 | `TABLE_NODE_WIDTH` |
| `src/lib/utils.ts` | 84 | `tablesToSQL` |
| `src/lib/utils.ts` | 26 | `getTableDefinitionAsMarkdown` |
| `src/components/TableNode.tsx` | 13 | `TABLE_NODE_ROW_HEIGHT` |
| `src/components/TableNode.tsx` | 12 | `TABLE_NODE_WIDTH` |

Fallow would also create `.fallowrc.json` with `ignoreExports` rules for:

- `src/components/TableNode.tsx`
- `src/lib/graph.ts`

Because this was a dry run, no cleanup was applied.

## Recommended Action Plan

1. Do not blindly apply `fallow fix` yet.
2. First convert `SchemaGraphCanvas.tsx` to use `tablesToSQL(tables)` so the SQL serializer remains exported and used.
3. Move table layout constants into a single `src/lib/constants.ts` module and import them from `graph.ts` and `TableNode.tsx`.
4. Remove the unused `ToolbarAction` type.
5. Remove `export` from `SchemaGraphContext` and `getTableDefinitionAsMarkdown` if they are internal-only.
6. Add parser tests before refactoring `parseSql.ts`.
7. Refactor duplicated FK parsing/building logic in `parseSql.ts` after tests exist.
8. Re-run:

```sh
npx fallow
npx tsc --noEmit
npm run build
```

## Notes

- Fallow reported 0 dead files, so there is no immediate file deletion candidate from static analysis.
- The top maintainability concern is `src/lib/parseSql.ts`, but it should not be aggressively refactored without tests because it depends on fragile `node-sql-parser` AST shapes.
- The easiest safe wins are unused exports/types and duplicated constants.
