# Phase 1 Refactor Plan — Safe Cleanup + Tooling

Updated: 2026-06-23  
Related docs: `fallow.md`, `gpt5.5-report.md`, `AUDIT.md`, `test.md`

## Goal

Phase 1 applies low-risk cleanup and baseline tooling without changing parser semantics or graph behavior beyond intentionally deduplicating SQL copy output.

This phase addresses the safest Fallow findings:

- Unused exports.
- Duplicate table layout constants.
- Duplicated SQL serialization.
- Internal-only exports.
- Missing repeatable validation scripts.

## Non-Goals

Do **not** do these in Phase 1:

- Do not refactor `parseSql.ts` internals yet.
- Do not add `sourceSchema` / `targetSchema` to `ParsedRelationship` yet.
- Do not change graph node IDs to schema-qualified IDs yet.
- Do not run `fallow fix` blindly.
- Do not suppress findings with `.fallowrc.json` when a code cleanup is straightforward.

These belong in later phases after tests exist.

## Preconditions

Before editing code, confirm current baseline:

```sh
npx tsc --noEmit
npm run build
npx fallow dead-code
```

Expected current Fallow dead-code findings:

- `TABLE_NODE_WIDTH` / `TABLE_NODE_ROW_HEIGHT` duplicate exports.
- `getTableDefinitionAsMarkdown` exported but internal-only.
- `tablesToSQL` exported but unused by canvas.
- `SchemaGraphContext` exported but internal-only.
- `ToolbarAction` unused type export.

## Code Changes

### 1. Create `src/lib/constants.ts`

New file:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

Rationale:

- Single source of truth for layout dimensions.
- Avoids duplicate exports from `graph.ts` and `TableNode.tsx`.
- Keeps UI components from importing graph/dagre code just to get constants.

### 2. Update `src/lib/graph.ts`

Add:

```ts
import { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH } from './constants'
```

Remove:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

Keep internal layout usage unchanged:

```ts
width: TABLE_NODE_WIDTH / 2,
height: (TABLE_NODE_ROW_HEIGHT / 2) * (node.data.columns.length + 1),
```

Expected impact:

- Removes two unused exports.
- Removes one half of the duplicate-export pair.

### 3. Update `src/components/TableNode.tsx`

Add:

```ts
import { TABLE_NODE_WIDTH } from '@/lib/constants'
```

Remove local constants:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

Keep usage:

```tsx
style={{ width: TABLE_NODE_WIDTH / 2 }}
```

Expected impact:

- Removes two unused exports.
- Deletes `TABLE_NODE_ROW_HEIGHT`, which is unused in this component.

### 4. Update `src/lib/utils.ts`

Change:

```ts
export function getTableDefinitionAsMarkdown(...)
```

to:

```ts
function getTableDefinitionAsMarkdown(...)
```

Keep `tablesToSQL` exported because Phase 1 will make the canvas use it.

Expected impact:

- Removes one unused export.
- Keeps markdown behavior unchanged.

### 5. Update `src/components/SchemaGraphCanvas.tsx`

Update import:

```ts
import { copyToClipboard, getSchemaAsMarkdown, tablesToSQL } from '@/lib/utils'
```

Replace inline `copyAsSQL` with:

```ts
const copyAsSQL = useCallback(() => {
  copyToClipboard(tablesToSQL(tables), () => toast.success('Schema SQL copied to clipboard'))
}, [tables])
```

Intentional behavior change:

- Copied SQL now includes `DEFAULT <value>` and `GENERATED ALWAYS AS IDENTITY` clauses because `tablesToSQL` includes them.
- This removes duplicate SQL serialization and makes `tablesToSQL` a real consumer-facing utility.

### 6. Update `src/components/SchemaGraphContext.tsx`

Change:

```ts
export const SchemaGraphContext = createContext<...>(...)
```

to:

```ts
const SchemaGraphContext = createContext<...>(...)
```

Keep these exports:

```ts
export function SchemaGraphContextProvider(...)
export function useSchemaGraphContext()
```

Expected impact:

- Removes one unused export while preserving public API.

### 7. Update `src/lib/types.ts`

Delete unused `ToolbarAction`:

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

Expected impact:

- Removes one unused type export.

### 8. Optional low-risk toolbar cleanup

File: `src/components/Toolbar.tsx`

Extract repeated class string:

```ts
const toolbarButtonClass =
  'flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
```

Then replace repeated `className="..."` values with:

```tsx
className={toolbarButtonClass}
```

This is optional for Phase 1 because Fallow’s primary Phase 1 findings are exports/dead code, not style duplication.

## Tooling Changes

### 9. Add `typecheck` script

Update `package.json`:

```json
"typecheck": "tsc --noEmit"
```

Then prefer:

```sh
npm run typecheck
```

instead of direct `npx tsc --noEmit`.

### 10. Add ESLint for Next.js 16

Install:

```sh
npm i -D eslint eslint-config-next
```

Update `package.json`:

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

Important:

- Do not use `next lint`; it is removed in Next.js 16.
- If lint surfaces existing `any` warnings in `parseSql.ts`, report them rather than refactoring parser internals in Phase 1.

## Validation

After Phase 1 code changes:

```sh
npm run typecheck
npm run build
npx fallow dead-code
```

If ESLint was added:

```sh
npm run lint
```

Expected Fallow improvement:

- Unused exports should drop significantly.
- Duplicate-export pair for `TABLE_NODE_WIDTH` / `TABLE_NODE_ROW_HEIGHT` should be resolved.
- `tablesToSQL` should no longer be reported as unused.

If any dead exports remain:

```sh
npx fallow dead-code --trace <file>:<symbol>
```

## Rollback Plan

If a Phase 1 change causes problems:

1. Revert only the failing file.
2. Run `npm run typecheck` or `npx tsc --noEmit`.
3. Run `npm run build`.
4. Leave parser and relationship model unchanged.

## Deferred Follow-Ups

### Phase 2 — Tests

Use `test.md` to add Vitest and parser-focused tests.

Key first tests:

- Empty input.
- Basic `CREATE TABLE`.
- Nullable default behavior.
- Inline FK.
- Table-level FK.
- `ALTER TABLE` FK.
- Cross-schema FK.

### Phase 3 — Schema-qualified relationships

After tests exist:

1. Add `sourceSchema` and `targetSchema` to `ParsedRelationship`.
2. Update all relationship builders in `parseSql.ts`.
3. Use schema-qualified React Flow node IDs in `graph.ts`.
4. Fix `page.tsx` relationship filtering by schema fields.
5. Fix synthetic foreign node labels.

### Phase 4 — Parser refactor

After tests and schema-qualified relationships:

1. Merge `getInlineReference` and `getTableLevelReference` into `getReferenceInfo`.
2. Extract shared FK relationship builder.
3. Split `parseSql` into smaller statement-specific helpers.
4. Replace broad `Record<string, any>` casts with local type guards where practical.

### Phase 5 — UX hardening

- Add `src/app/error.tsx`.
- Improve clipboard failure toasts.
- Improve export-to-image error messages.
- Verify/remove unused public SVG assets.

## Results

_Not executed yet. Fill this section after implementation with:_

- Files changed.
- Commands run.
- Fallow before/after summary.
- Any remaining warnings or deferred items.
