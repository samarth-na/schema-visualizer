# Schema Visualizer — Improvement Roadmap

A sequenced plan for stack and architecture improvements. **Start with Phase 0** and pause for review between phases.

**Guiding decisions (confirmed):**

- Foundations first + parser/state rework + full UX roadmap
- Parser: typed wrapper on `node-sql-parser` (no switch to libpg_query WASM for now)
- React Flow: show attribution (do not buy Pro, do not use `hideAttribution`)

---

## Phase 0 — Foundations (correctness + license + DX)

### 0.1 License compliance

- `src/components/SchemaGraphCanvas.tsx:191` — delete `proOptions={{ hideAttribution: true }}`. The free `@xyflow/react` license requires the attribution to remain visible.

### 0.2 AUDIT bug fixes (small, surgical)

- `src/app/page.tsx:76-80` — `filteredSchema` relationship filter: keep a relationship if its `sourceTable` **or** `targetTable` is in the selected schema (currently only the source is checked, so cross-schema FKs whose target lives in the selected schema are silently dropped).
- `src/app/page.tsx:48-63` — drop the `setTimeout` in `handleLoadExample`. `setSql` and `parseSql(SAMPLE_SCHEMA)` do not depend on React state; the timeout is unnecessary and double-parses if the user clicks Render afterwards. Call `setSql(SAMPLE_SCHEMA)` + `setSchema(parseSql(SAMPLE_SCHEMA))` synchronously.
- `src/lib/parseSql.ts:49` — `isNotNull`: when `definition` is not an object, `return false` (nullable) and delete the misleading inline comment. The current `return true` contradicts the documented "default is nullable unless specified" contract.
- `src/lib/graph.ts:76` + `src/components/DefaultEdge.tsx:147-149` — synthetic foreign-node label bug. `graph.ts:83` writes `schema: rel.targetTable, name: targetId` for unknown targets, and `DefaultEdge` then renders `data.targetSchemaName` which for cross-schema refs is `rel.targetTable`, producing duplicated labels like `users.users.user_id`. Use a placeholder (`?` or empty string) for unknown schema/name.
- `src/lib/graph.ts:76` — replace `nodes.some((n) => n.id === targetId)` (O(N) per cross-schema reference, O(N·M) worst case) with a `Set<string>` of existing node ids for O(1) lookup.

### 0.3 Tooling (PHASE1_PLAN still pending)

- Add scripts to `package.json`:
  - `"typecheck": "tsc --noEmit"`
  - `"lint": "biome lint ."`
  - `"lint:fix": "biome lint . --write"`
  - `"test": "vitest run"`
  - `"format": "biome format ."`
  - `"format:fix": "biome format . --write"`
  - `"check": "biome check ."`
  - `"check:fix": "biome check . --write"`
- Keep `biome.json` as the single linting and formatting configuration.
- Create `vitest.config.ts` (jsdom env is fine; `tsx` is already a dev dep, can also be used to run scripts).
- Add `.github/workflows/ci.yml`: run `typecheck`, `lint`, `test` on PRs and pushes to `main`.

### 0.4 Boilerplate cleanup

- Delete leftover create-next-app assets: `public/{next,vercel,file,globe,window}.svg`. None are referenced in `src/`.
- Rewrite `README.md` to describe the visualizer (usage, supported DDL, PG-only note, known limitations such as missing table-level comments until Phase 1.5 lands).
- Remove dead `ToolbarAction` type at `src/lib/types.ts:60-67` (never imported).

### 0.5 Error boundary

- New `src/components/ErrorBoundary.tsx` (class component or a small library).
- Wrap `<ReactFlowProvider>` in `src/app/page.tsx:170` with the boundary so a render error inside `TableNode` cannot blank the whole canvas. Show a "Reset" button on the error fallback.

**Verify Phase 0:** `bun run typecheck && bun run lint && bun run test && bun run build` all green; CI is live and passing.

---

## Phase 1 — Parser adapter (typed wrapper on node-sql-parser)

The single biggest risk in the codebase is the `node-sql-parser` AST accessed through `Record<string, any>` casts. This phase introduces a typed adapter and refactors `parseSql` against fixture tests, without switching parser libraries.

### 1.1 New `src/lib/parser/ast-types.ts`

Define a discriminated AST subset that the rest of the app consumes. All `any` casts stay inside the adapter:

```ts
export type SqlAstNode = { type: string; [k: string]: unknown }

export type ColumnName = { expr: { type: 'default'; value: string } }
export type ColumnRefExpr = { type: 'column_ref'; table: string | null; column: ColumnName | string }

export type ColumnDefinition = {
  dataType?: string
  length?: number | number[] | string
  nullable?: { type: string; value?: string } | string
  default_val?: unknown
  default?: unknown
  comment?: string | { value: string }
  auto_increment?: unknown
  identity?: unknown
  primary_key?: string
  unique?: string
  definition?: ColumnDefinition
  reference_definition?: ReferenceDef
}

export type ReferenceDef = {
  table: TableRef[] | TableRef
  definition: ColumnRefExpr[] | ColumnRefExpr
}

export type TableRef = { db: string | null; table: string }

export type CreateColumnDef = {
  resource: 'column'
  column: ColumnRefExpr
  definition: ColumnDefinition
}

export type TableConstraint = {
  resource: 'constraint'
  constraint_type: string
  constraint?: string
  definition: ColumnRefExpr[] | ColumnRefExpr
  reference_definition?: ReferenceDef
}

export type CreateTableStmt = {
  type: 'create'
  keyword: 'table'
  table: TableRef[] | TableRef
  create_definitions: Array<CreateColumnDef | TableConstraint>
}

export type AlterAddExpr = {
  action: 'add'
  create_definitions?: TableConstraint[] | TableConstraint
  definition?: TableConstraint[] | TableConstraint
}

export type AlterTableStmt = {
  type: 'alter'
  table: TableRef[] | TableRef
  expr: AlterAddExpr[] | AlterAddExpr
}

export type SqlStmt = CreateTableStmt | AlterTableStmt | SqlAstNode

export function isCreateTableStmt(node: unknown): node is CreateTableStmt { ... }
export function isAlterTableStmt(node: unknown): node is AlterTableStmt { ... }
export function isTableConstraint(node: unknown): node is TableConstraint { ... }
```

### 1.2 New `src/lib/parser/nodeSqlAdapter.ts`

A small wrapper that owns the `Parser` instance and produces typed `SqlStmt[]`:

```ts
import { Parser } from "node-sql-parser";
const parser = new Parser();

export function parseToStatements(sql: string): SqlStmt[] {
  let ast: unknown;
  try {
    ast = parser.astify(sql.trim(), { database: "PostgresQL" });
  } catch {
    ast = parser.astify(sql.trim());
  }
  const arr = Array.isArray(ast) ? ast : ast ? [ast] : [];
  return arr.filter((n): n is SqlAstNode => !!n && typeof n === "object");
}
```

This is the only module that touches the parser; the rest of the app sees typed `SqlStmt`.

### 1.3 Refactor `parseSql.ts` → `src/lib/parser/parseSql.ts`

- Replace every `Record<string, any>` access with the typed fields via the narrowing guards.
- Merge byte-identical `getInlineReference` (`:127`) and `getTableLevelReference` (`:146`) into a single `extractReference(def)`.
- Split the 194-LOC `parseSql` into `parseCreateTable`, `parseTableConstraints`, `parseAlterTable`. Both sub-functions return `ParsedRelationship[]`; the top-level `parseSql` concatenates. Driven by tests from 1.4 — do not split before tests exist.
- Keep `formatParseError` exported for the UI.

### 1.4 Fixture tests (write BEFORE refactor)

Create `src/lib/parser/__tests__/parseSql.test.ts` with real Supabase-shaped DDL fixtures:

- single CREATE TABLE with inline `REFERENCES`
- CREATE TABLE with table-level `FOREIGN KEY (...) REFERENCES ...` (single + multi-column)
- `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`
- columns with `GENERATED ALWAYS AS IDENTITY` and `SERIAL`
- multi-schema DDL (e.g. `auth.users` + `public.posts`)
- `COMMENT ON COLUMN` and `COMMENT ON TABLE` (Phase 1.5)
- quoted identifiers (`"order"`, backticks)
- known parser-version fragility cases (e.g. `DEFAULT now()`, `DEFAULT CURRENT_TIMESTAMP`)

Strategy: write tests against the **current** `parseSql` output, capture results as golden, then refactor and verify goldens still pass. This guards the AST assumptions before and after the refactor and catches `node-sql-parser` upgrade drift in CI.

### 1.5 Populate `ParsedTable.comment`

The field is plumbed through `types.ts` but always `null` (`parseSql.ts:288`). With the typed adapter in place, add handling for `COMMENT ON TABLE <name> IS '<text>'` statements. Surface the value in `TableNode`.

**Verify Phase 1:** All fixture tests pass; `bun run typecheck && bun run lint && bun run build` clean; `node-sql-parser` upgrade tested by bumping a major version locally and confirming green.

---

## Phase 2 — State architecture (Zustand + Web Worker)

`page.tsx` is a single 86-LOC client component holding all state via `useState`. Scaling this up will hurt. This phase introduces a central store and moves parsing off the main thread.

### 2.1 Zustand store

- `bun add zustand`
- New `src/state/schemaStore.ts`:
  ```ts
  interface SchemaGraphState {
    sql: string;
    schema: ParsedSchema;
    selectedSchema: string;
    error: string | null;
    isRendering: boolean;
    setSql(sql: string): void;
    render(): Promise<void>;
    clear(): void;
    loadExample(): void;
    setSelectedSchema(name: string): void;
  }
  ```
- Migrate the handlers in `page.tsx:26-70` (`handleRender`, `handleLoadExample`, `handleClear`) to store actions.
- Replace `page.tsx:72-82` `filteredSchema` `useMemo` with a selector that memoizes on `(schema, selectedSchema)` only when contents change (no more new-object-every-render).
- Components subscribe via narrow selectors so `TableNode` does not re-render on selection changes. This obviates the O(N) `handleSelectionChange` edge animation hack (`SchemaGraphCanvas.tsx:66-89`); switch to React Flow's built-in node-hover/selection edge animation.

### 2.2 Web Worker for parsing

- New `src/lib/parser/parse.worker.ts` that runs `parseToStatements` + `parseSql`.
- Store action `render()` posts the DDL to the worker and awaits the result, keeping the UI responsive on large pastes.
- Use plain `postMessage` (no extra dep) or `comlink` if ergonomics win out.

### 2.3 Move `<Toaster/>` to root layout

- Mount `<Toaster/>` in `src/app/layout.tsx` so toasts survive route transitions once more pages are added. Remove from `page.tsx:86`.

### 2.4 Sharper exports

- `useExportSchemaToImage.ts` + `SchemaGraphCanvas.downloadImage` (`:135-150`): clone the graph off-screen at scale 1 and snapshot that, not the live `.react-flow__viewport` (currently rendered at the user's zoom). Sharp output unaffected by user pan/zoom.
- Verify `includeStyleProperties` is a real `html-to-image` option (AUDIT §3/§4 flag it as a likely no-op). Replace with a proper `filter`/`style` if not.

**Verify Phase 2:** Same scripts green; manual smoke test of paste-large-schema responsiveness (UI must stay interactive while parsing).

---

## Phase 3 — UX & features expansion

### 3.1 Shareable URLs

- gzip DDL → base64 → `location.hash`; on load, if a hash is present, hydrate `sql` and auto-render. No backend, no serverless function. Lets users share diagrams by sending a link.

### 3.2 Persistence

- `localStorage` for the last 5 pastes. Optional `idb-keyval` (tiny dep) for large schemas that exceed the localStorage quota.
- "Recent" dropdown in the input panel (`Toolbar.tsx` / `page.tsx`).

### 3.3 Drag-drop / file upload

- Dropzone on `<main>` in `page.tsx`. Accepts `.sql` files, reads via `FileReader`, routes through the same `render()` action.

### 3.4 Surface table comments

- With Phase 1.5 populating `ParsedTable.comment`, render the comment in `TableNode` (subtitle below the table name).

### 3.5 Centralize styles

- Extract a `Button` primitive in `src/components/ui/Button.tsx`.
- Collapse the 4× repeated className in `Toolbar.tsx:51-93`. Migrate the input-panel buttons in `page.tsx:101-115` and `136-148`.

**Verify Phase 3:** Manual smoke; CI green; bundle size delta documented.

---

## Phase 4 — Optional, later

- **Reverse direction: edit the graph → emit DDL.** The typed model + store from Phases 1–2 make this tractable. Significant feature; scope it as its own plan.
- **PWA / Tauri wrapper** for users handling proprietary DDL who don't want to paste into a hosted site.
- **Multi-dialect** (MySQL, SQLite) behind the parser adapter interface. The adapter module from Phase 1.2 is the natural extension point.

---

## Risks and sequencing notes

- **Phase 1.4 before Phase 1.3.** Tests must exist against the current output before the refactor. Sequence: write fixtures + capture goldens → refactor → verify goldens match.
- **Phase 2 store migration** touches `page.tsx` and `SchemaGraphCanvas.tsx`; do it after Phase 0 tooling is in place to keep diffs reviewable.
- **Phase 2.2 worker** makes `render()` async. Loading state becomes meaningful; expect to surface a `<Loader2/>` skeleton in the input panel.
- **Bundle impact.** Typed wrapper is free at runtime (types erase). Worker adds a second chunk loaded on demand. `idb-keyval` is ~1 KB; `comlink` is ~10 KB — choose based on actual ergonomics.

---

## Status tracker

- [ ] Phase 0.1 — Attribution
- [ ] Phase 0.2 — AUDIT bug fixes
- [ ] Phase 0.4 — Boilerplate cleanup
- [ ] Phase 0.5 — Error boundary
- [ ] Phase 1.1 — AST types
- [ ] Phase 1.2 — nodeSqlAdapter
- [ ] Phase 1.3 — parseSql refactor
- [ ] Phase 1.4 — Fixture tests
- [ ] Phase 1.5 — Table comments
- [ ] Phase 2.1 — Zustand store
- [ ] Phase 2.2 — Worker
- [ ] Phase 2.3 — Toaster in layout
- [ ] Phase 2.4 — Sharper exports
- [ ] Phase 3.1 — Shareable URLs
- [ ] Phase 3.2 — Persistence
- [ ] Phase 3.3 — File upload
- [ ] Phase 3.4 — Render table comments
- [ ] Phase 3.5 — Button primitive
- [ ] Phase 4 — Reverse direction / PWA / multi-dialect
