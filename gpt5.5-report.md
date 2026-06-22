# GPT-5.5 Codebase Review Report

Reviewed project: `schema-visualizer`  
Date: 2026-06-23  
Stack: Next.js 16.2.9, React 19.2.4, Tailwind 4, `@xyflow/react`, `@dagrejs/dagre`, `node-sql-parser`

## Executive Summary

This is a compact single-page schema visualizer with a clear separation between parsing/layout logic in `src/lib/` and UI/rendering code in `src/components/`. The project currently builds and type-checks successfully, and the overall architecture is understandable for a small App Router application.

The highest-risk areas are correctness around multi-schema foreign keys, PostgreSQL DDL parsing edge cases, React Flow license compliance, and missing automated tests/tooling. The app is usable, but parser behavior is fragile because it relies on untyped `node-sql-parser` AST shapes and has no regression tests.

## Validation Performed

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed |

No lint or test command exists in `package.json`.

## Strengths

- `src/app/page.tsx` keeps the app flow simple: SQL input, parse, schema selection, and graph rendering.
- `src/lib/types.ts` centralizes the project’s app-level schema, table, column, and edge data types.
- Pure logic is mostly isolated in `src/lib/parseSql.ts`, `src/lib/graph.ts`, and `src/lib/utils.ts`.
- React Flow integration uses memoized `nodeTypes` and `edgeTypes` in `src/components/SchemaGraphCanvas.tsx`, avoiding a common performance footgun.
- `TableNode` is memoized with a custom comparator in `src/components/TableNode.tsx`.
- The project is already on modern Next.js 16, React 19, and Tailwind 4.
- Production build succeeds with Turbopack.

## High-Priority Findings

### 1. Cross-schema relationship filtering is incorrect

File: `src/app/page.tsx`

`filteredSchema` only keeps relationships whose `sourceTable` belongs to the selected schema:

```ts
relationships: schema.relationships.filter(
  (r) =>
    schema.tables.find((t) => t.name === r.sourceTable && t.schema === selectedSchema) !==
    undefined
),
```

This drops relationships where the selected schema contains the target table but the source table is in another schema. That is a correctness bug for multi-schema Supabase/PostgreSQL projects.

Recommended fix:

- Keep relationships where either endpoint is in the selected schema.
- Ideally include schema information directly in `ParsedRelationship` so same-named tables across schemas do not collide.

### 2. Relationship model omits source/target schema names

File: `src/lib/types.ts`, `src/lib/parseSql.ts`, `src/lib/graph.ts`

`ParsedRelationship` stores only `sourceTable`, `sourceColumn`, `targetTable`, and `targetColumn`. It does not store source or target schema names, even though `parseSql.ts` extracts reference schema information in `getInlineReference` and `getTableLevelReference`.

Consequences:

- Tables with the same name in different schemas can collide.
- Cross-schema edge labels and synthetic nodes are unreliable.
- Page-level schema filtering has to infer relationship membership from table names.

Recommended fix:

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

Then update graph node IDs to be schema-qualified, e.g. `${schema}.${table}`.

### 3. React Flow attribution is hidden

File: `src/components/SchemaGraphCanvas.tsx`

```tsx
proOptions={{ hideAttribution: true }}
```

This hides React Flow attribution. Under the free `@xyflow/react` license, hiding attribution is not allowed unless the project has a paid Pro entitlement.

Recommended fix:

- Remove `proOptions={{ hideAttribution: true }}`, or
- Document and verify React Flow Pro licensing before shipping.

### 4. PostgreSQL AST parsing is fragile and under-tested

File: `src/lib/parseSql.ts`

`parseSql.ts` uses many `Record<string, any>` casts against `node-sql-parser` AST structures. This makes the app vulnerable to parser version changes and unhandled DDL shapes.

Examples:

- `extractColumnName`
- `parseDataType`
- `extractDefaultValue`
- `getInlineReference`
- `getTableLevelReference`
- main `parseSql` loops

This is especially risky because there are no tests.

Recommended fix:

- Add fixture-based parser tests for common Supabase/PostgreSQL DDL.
- Introduce narrow AST helper types and type guards instead of broad `any` casts.
- Lock down behavior for inline FKs, table-level FKs, `ALTER TABLE`, defaults, identity columns, nullable columns, and schema-qualified names.

### 5. `isNotNull` default behavior is inconsistent

File: `src/lib/parseSql.ts`

```ts
function isNotNull(definition: unknown): boolean {
  if (!definition || typeof definition !== 'object') return true // default to not null? Actually default is nullable unless specified. Keep false.
```

The comment says PostgreSQL columns are nullable by default, but the function returns `true` for invalid/non-object definitions, which means “not null”.

Recommended fix:

```ts
if (!definition || typeof definition !== 'object') return false
```

This aligns with PostgreSQL’s default nullable behavior.

## Medium-Priority Findings

### 6. Duplicate SQL serialization logic

Files:

- `src/components/SchemaGraphCanvas.tsx`
- `src/lib/utils.ts`

`SchemaGraphCanvas.tsx` has an inline `copyAsSQL` implementation while `src/lib/utils.ts` already exports `tablesToSQL`. The two differ: `tablesToSQL` includes `DEFAULT` and `GENERATED ALWAYS AS IDENTITY`; the canvas copy path omits them.

Recommended fix:

- Replace the inline canvas serializer with `tablesToSQL(tables)`.
- Keep SQL export behavior in one place.

### 7. Duplicate table node constants

Files:

- `src/lib/graph.ts`
- `src/components/TableNode.tsx`

Both define:

```ts
TABLE_NODE_WIDTH = 320
TABLE_NODE_ROW_HEIGHT = 40
```

`TABLE_NODE_ROW_HEIGHT` in `TableNode.tsx` is not used.

Recommended fix:

- Create `src/lib/constants.ts` for shared layout constants.
- Import `TABLE_NODE_WIDTH` into `TableNode.tsx`.
- Import both constants into `graph.ts`.

### 8. Duplicate reference helper functions

File: `src/lib/parseSql.ts`

`getInlineReference` and `getTableLevelReference` are effectively identical. This creates maintenance drift risk.

Recommended fix:

- Replace both with a single `getReferenceInfo` helper.

### 9. Synthetic foreign nodes use confusing labels

File: `src/lib/graph.ts`

When a target table is not present, the graph creates a synthetic node:

```ts
schema: rel.targetTable,
name: targetId,
```

This can produce confusing labels like `users.users.user_id` because schema information is guessed from the table name.

Recommended fix:

- Store relationship schema names in `ParsedRelationship`.
- Use the real `targetSchema` when available.
- If unavailable, render a clear placeholder rather than reusing the table name as schema.

### 10. `handleLoadExample` uses unnecessary `setTimeout`

File: `src/app/page.tsx`

The example loader calls `setSql(SAMPLE_SCHEMA)` and then parses `SAMPLE_SCHEMA` inside `setTimeout(..., 0)`. The parse does not depend on React state being flushed, so the timeout is unnecessary.

Recommended fix:

- Parse synchronously using `SAMPLE_SCHEMA`.
- Remove the misleading comment.

### 11. `copyToClipboard` silently fails in the UI

File: `src/lib/utils.ts`

`copyToClipboard` logs failures but does not expose the error to callers. Users see no toast if clipboard permissions fail.

Recommended fix:

- Return `boolean` or throw on failure.
- Show an error toast at call sites.

### 12. Export-to-image implementation may be brittle

File: `src/components/useExportSchemaToImage.ts`

The export logic serializes `.react-flow__viewport` and applies the current transform. Potential issues:

- PNG/SVG output may reflect current zoom/pan in a way that is hard to predict.
- Large schemas may export at poor resolution.
- `includeStyleProperties` should be verified against the installed `html-to-image` version.
- `skipFonts: true` may produce visual differences from the app.

Recommended fix:

- Add manual test coverage for export behavior.
- Consider exporting an off-screen normalized graph rather than the live viewport.

## Low-Priority Findings / Cleanup

### 13. Unused type

File: `src/lib/types.ts`

`ToolbarAction` appears unused.

Recommended fix:

- Remove it unless planned for imminent use.

### 14. Public assets and README are boilerplate

Files:

- `README.md`
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

These appear to be default create-next-app leftovers and do not describe the schema visualizer.

Recommended fix:

- Rewrite `README.md` with app purpose, setup, supported SQL subset, limitations, and commands.
- Delete unused public SVGs if they are not referenced.

### 15. Styling duplication in toolbar

File: `src/components/Toolbar.tsx`

The button class string is repeated several times.

Recommended fix:

- Extract a local `toolbarButtonClass` constant or a small `ToolbarButton` component.

### 16. `Toaster` placement is page-local

File: `src/app/page.tsx`

`Toaster` is mounted inside the page. This is acceptable for the current single-page app, but if the app grows to multiple routes, `Toaster` should move to `src/app/layout.tsx`.

### 17. No error boundary

Rendering errors inside the graph/tree would currently take down the full page.

Recommended fix:

- Add an App Router `error.tsx`, or
- Add a component-level error boundary around the graph canvas.

## Tooling Gaps

### Missing scripts

`package.json` has:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

Recommended additions:

```json
"typecheck": "tsc --noEmit",
"lint": "eslint ."
```

For Next.js 16, do not use `next lint`; use ESLint CLI with `eslint-config-next` flat config.

### Missing tests

The parser is the best first testing target.

Recommended test coverage:

- Empty input returns no tables.
- Basic `CREATE TABLE`.
- Schema-qualified `CREATE TABLE`.
- Inline primary key.
- Table-level primary key.
- Inline foreign key.
- Table-level foreign key.
- `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`.
- Nullable/default behavior.
- Identity/serial columns.
- Multiple schemas and same table names in different schemas.

## Suggested Prioritized Fix Plan

1. Remove or justify React Flow `hideAttribution`.
2. Add `typecheck` script and ESLint flat config for Next.js 16.
3. Add parser regression tests before large parser refactors.
4. Extend `ParsedRelationship` to include `sourceSchema` and `targetSchema`.
5. Use schema-qualified node IDs in graph generation.
6. Fix selected-schema relationship filtering.
7. Fix `isNotNull` default return.
8. Deduplicate SQL serialization by using `tablesToSQL` in `SchemaGraphCanvas.tsx`.
9. Deduplicate graph/table node constants.
10. Merge duplicate reference helper functions in `parseSql.ts`.
11. Rewrite `README.md` and remove boilerplate public assets.

## Overall Assessment

The codebase is small, readable, and currently passes type checking and production build. The main technical debt is not general architecture; it is correctness and confidence around PostgreSQL parsing and multi-schema relationship modeling. Addressing schema-qualified relationships and adding parser tests would substantially improve reliability. The React Flow attribution issue should be handled before any public deployment.
