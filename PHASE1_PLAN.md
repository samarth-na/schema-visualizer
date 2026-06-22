# Phase 1 Refactor Plan — Dead Code + Tooling

Addresses the fallow report (10 dead-code issues, duplicate-export pair) and adds
the lint/typecheck tooling that `AGENTS.md` instructs but doesn't exist yet.
Out of scope: `parseSql.ts` dedup and decomposition (kept as follow-ups; see
`AUDIT.md` item #2 and fallow refactoring target #2).

## Code changes

### 1. Create `src/lib/constants.ts` (new file)

Single source of truth for layout dimensions used by both the dagre layout
(`lib/graph.ts`) and the node component (`components/TableNode.tsx`). A
dedicated module avoids pulling dagre into the TableNode client bundle via
tree-shaking edge cases.

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

### 2. `src/lib/graph.ts`

- Delete `export const TABLE_NODE_WIDTH` / `TABLE_NODE_ROW_HEIGHT` (lines 7-8).
- Add `import { TABLE_NODE_WIDTH, TABLE_NODE_ROW_HEIGHT } from './constants'`.
- Internal usage at lines 155-156 stays as-is.

### 3. `src/components/TableNode.tsx`

- Delete `export const TABLE_NODE_WIDTH` / `TABLE_NODE_ROW_HEIGHT` (lines 12-13).
- Add `import { TABLE_NODE_WIDTH } from '@/lib/constants'` (only `WIDTH` is used
  at line 57; `ROW_HEIGHT` was dead even within this file).
- Internal usage at line 57 stays as-is.

### 4. `src/lib/utils.ts`

- Drop `export` from `getTableDefinitionAsMarkdown` (line 26) — it's used only
  internally by `getSchemaAsMarkdown` (line 79) and has no external consumer.
- `tablesToSQL` stays exported (it gains a real consumer in step 5).

### 5. `src/components/SchemaGraphCanvas.tsx`

Replace the inline `copyAsSQL` body (lines 114-127) with a call to `tablesToSQL`,
turning the dead export into a used one and removing the duplicate SQL
generation logic.

- Add `tablesToSQL` to the existing import from `@/lib/utils` (line 17).
- New body:

  ```ts
  const copyAsSQL = useCallback(() => {
    copyToClipboard(tablesToSQL(tables), () =>
      toast.success('Schema SQL copied to clipboard')
    )
  }, [tables])
  ```

**Behavior change:** the copied SQL now includes `DEFAULT <value>` and
`GENERATED ALWAYS AS IDENTITY` clauses (which the inline implementation
omitted). This is the intended dedup (AUDIT item #2).

`tables` is `ParsedTable[]` (from `schema.tables` at line 33), which matches
`tablesToSQL`'s parameter type.

### 6. `src/components/SchemaGraphContext.tsx`

- Drop `export` from `SchemaGraphContext` (line 11) — used only internally at
  lines 19 and 22. External consumers import `SchemaGraphContextProvider` and
  `useSchemaGraphContext`.

### 7. `src/lib/types.ts`

- Delete the `ToolbarAction` type (lines 60-67) — never imported anywhere.

## Tooling changes

### 8. `package.json` scripts

Add:

```json
"typecheck": "tsc --noEmit",
"lint": "eslint ."
```

`next lint` is **removed in Next.js 16** (verified in
`node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md`).
The new approach uses the ESLint CLI directly with `eslint-config-next`'s
flat config.

### 9. Install ESLint deps

```
npm i -D eslint eslint-config-next
```

### 10. Create `eslint.config.mjs`

Per the Next 16 ESLint guide (core-web-vitals + typescript, with default
ignores):

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

## Verification

1. `npm run typecheck` — must pass.
2. `npm run lint` — must pass. If pre-existing lint errors surface (e.g.
   `Record<string, any>` casts, `colorMode={'' as unknown as ColorMode}`),
   they will be reported rather than silently fixed as part of this phase.
3. Re-run `fallow` — expect unused exports 21.1% → 0%, duplicate-export pair
   resolved.

## Out of scope (follow-ups)

- `parseSql.ts` dedup: merge `getInlineReference` / `getTableLevelReference`
  (byte-identical); extract shared FK-relationship builder for the two clone
  groups (`dup:e1014e9c` at 314-333 ↔ 357-376). See `AUDIT.md` item #2.
- `parseSql` decomposition: split the 194-LOC function (cognitive 193) into
  `parseCreateTable` / `parseTableConstraints` / `parseAlterTable`. Risky
  without tests (AUDIT item #9); out of scope for Phase 1.
- Other `AUDIT.md` items: filteredSchema bug, `isNotNull` early return,
  `handleLoadExample` setTimeout, React Flow attribution, toolbar `Button`
  primitive, etc. Tracked in `AUDIT.md` prioritized fix order.

## Results

_Filled in after execution._
