# Schema Visualizer — Codebase Audit

Reviewed: 16 source files, ~1,300 LOC. Stack: Next.js 16 (App Router) + React 19 + `@xyflow/react` 12 + `node-sql-parser` 5 + Tailwind 4 + dagre.

## 1. Cleanliness

### Strengths
- Clear file separation: `lib/` for pure logic (parse, graph, utils, types), `components/` for UI. Type definitions centralized in `types.ts`.
- Consistent use of `'use client'` directives, `@/` path alias, and small focused modules.
- `TableNode` correctly memoized with a custom comparator; `nodeTypes`/`edgeTypes` memoized in `SchemaGraphCanvas.tsx:38-49` (a common React Flow gotcha that's handled right).
- `types.ts` is well-typed and shared cleanly between parser and view layer.

### Issues
- `parseSql.ts` leans heavily on `unknown` + `Record<string, any>` casts (e.g. `parseSql.ts:10, 25, 50, 62`). With `strict: true` enabled, this is essentially type-escaping — the parser's AST shape is the codebase's biggest risk surface and has zero static guarantees. Consider generating types from `node-sql-parser` or defining a discriminated AST subset.
- Dead/misleading comment at `parseSql.ts:49`: `// default to not null? Actually default is nullable unless specified. Keep false.` — the comment contradicts itself and was left in.
- `getInlineReference` (127) and `getTableLevelReference` (146) are **byte-identical** implementations — 18 lines of duplication. One should fold into the other.
- `Toolbar.tsx` copy buttons (51-93) repeat the same long `className` 4× verbatim; a `Button` primitive would shrink this significantly.
- Inconsistent formatting (semicolons/quotes) between files — `parseSql.ts` uses single quotes, `layout.tsx`/`page.tsx` use double quotes; mix of trailing-comma styles. No ESLint/Prettier config in `package.json`.
- `ColorMode` import + `colorMode={'' as unknown as ColorMode}` (`SchemaGraphCanvas.tsx:179`) is a code smell — hacks the type system to pass an empty string. Either use `'light'`/`'dark'` or omit the prop.
- `CLAUDE.md` is just `@AGENTS.md` — an alias file; fine, but `AGENTS.md`'s "This is NOT the Next.js you know" preamble is generic scaffolding not tailored to this project.

## 2. Bloat

- **Unused sample/public assets**: `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` are leftover create-next-app boilerplate, none referenced anywhere in `src/`. README is also unmodified boilerplate describing Next.js, not the actual app.
- **Duplicated SQL generation**: `utils.ts:84 tablesToSQL` and `SchemaGraphCanvas.tsx:114 copyAsSQL` produce nearly identical output with slight divergences (the Canvas one omits `DEFAULT` and `GENERATED IDENTITY`). One should call the other — currently two sources of truth.
- **Duplicate style constants**: `TABLE_NODE_WIDTH`/`TABLE_NODE_ROW_HEIGHT` are exported from both `lib/graph.ts:7-8` and `components/TableNode.tsx:12-13` with identical values. Single source of truth needed.
- `ToolbarAction` type (`types.ts:60-67`) is declared but never imported/used anywhere.
- `TableNodeData.comment` field is always `null` from the parser (`parseSql.ts:288`) — comment extraction only exists at column level (`extractComment`), not table level. The field is structural dead weight today.
- `getSchemaAsMarkdown`/`getTableDefinitionAsMarkdown` accept an ad-hoc inline type instead of reusing `TableNodeData` or `ParsedTable`, forcing the call site to map shapes — minor but symptomatic of type drift.

## 3. Performance

- **Re-fit on every `tables` identity change**: `SchemaGraphCanvas.tsx:52-65` runs `setNodes`/`setEdges` in `useEffect` keyed on `[tables, relationships, selectedSchemaName]`. `page.tsx:72-82` recomputes `filteredSchema` each render as a new object via `useMemo` — but every `setSchema` call produces a new `tables` array reference even when contents are unchanged, triggering graph rebuilds and `fitView` repeatedly. Acceptable for a paste-once tool but degrades with large schemas.
- **Edge animation diff shenanigans**: `handleSelectionChange` (`SchemaGraphCanvas.tsx:67-89`) iterates **all** edges + `getNodes()` on every selection change and calls `setEdges` if any `animated` flag differs. With N edges this is O(N) per selection tick; for large schemas this stalls interactions. React Flow has built-in edge animation on node hover/selection that avoids manual syncing.
- **`nodes.some((n) => n.id === targetId)` inside a loop** (`graph.ts:76`) is O(N) per cross-schema reference → O(N·M) worst case. A `Set` of existing node ids would make this O(1).
- **`colorMode={'' as unknown as ColorMode}`** combined with `onlyRenderVisibleElements` is fine, but `requestAnimationFrame(() => fitView())` after every render (`SchemaGraphCanvas.tsx:62`, `:97`, `:154`) can fight user pan/zoom if a render lands while the user is interacting.
- `useExportSchemaToImage.ts:64-78 getAllPropertyNames` iterates every computed style on the document root once (memoized) — fine, but `includeStyleProperties` with hundreds of names inflates SVG/PNG serialization cost; consider an allow-list.
- `html-to-image` on the viewport with `transform: scale(zoom)` produces screenshots at the rendered (scaled) resolution, not at crisp native size — exports may look pixelated compared to the live canvas.

## 4. Mistakes / Bugs

- **`filteredSchema` relationship filter is wrong** (`page.tsx:76-80`): it only keeps relationships whose `sourceTable` is in the selected schema, silently dropping relationships where the *target* is in the selected schema but the source is in another schema. Should check both endpoints. The graph code in `graph.ts:73` already creates synthetic foreign nodes for missing targets, but the page-level filter pre-empts those cases.
- **`handleLoadExample`'s `setTimeout`** (`page.tsx:52-62`): the comment "Auto-render after a tick so the textarea updates first" reveals a confused mental model — `setSql` and `parseSql(SAMPLE_SCHEMA)` don't depend on React state at all; the timeout is unnecessary. The same `parseSql(SAMPLE_SCHEMA)` is invoked twice if the user then clicks Render. Just call `setSchema(parseSql(SAMPLE_SCHEMA))` synchronously.
- **`isNotNull` early return inconsistent** (`parseSql.ts:48-58`): the inline comment admits "default is nullable unless specified. Keep false" but `if (!definition || typeof definition !== 'object') return true` at line 49 returns `true` (not nullable) for non-object defs — inconsistent with the rest of the function. Should be `return false`.
- **`DefaultEdge.tsx` unused props**: `edgePath` is destructured at `DefaultEdge.tsx:87` but never used inside `EdgeRelationInfo`; the other props `sourceX`/`targetX` are only used once at `:145` for the direction comparison. The other destructured props (`source`, `target`, `labelX`, `labelY`, `data`) are actually consumed.
- **Synthetic foreign node label bug** (`graph.ts:83`): `schema: rel.targetTable` and `name: targetId` — the data layer encodes "we don't know" by reusing the table name. Downstream `DefaultEdge.tsx:147-149` then renders `data.targetSchemaName` which for cross-schema refs is `rel.targetTable` (`graph.ts:106`) — so the label shows `users.users.user_id`, confusingly duplicated. Should be empty or a placeholder like `?`.
- **`proOptions={{ hideAttribution: true }}`** (`SchemaGraphCanvas.tsx:193`) removes the React Flow attribution. This is only permitted under a paid React Flow Pro subscription; using the free `@xyflow/react` with `hideAttribution` violates the license.
- **No error boundary** around `ReactFlowProvider` / `TableNode` — a parse error doesn't crash but a rendering error in `TableNode` (e.g. missing `data`) would take down the whole canvas.
- **`Toaster` mounted in the page, not the root layout** (`page.tsx:86`) — works today but won't survive route transitions if more pages are added.
- **`useExportSchemaToImage` option key**: `includeStyleProperties` is not a documented `html-to-image` option key (the lib documents `filter`/`style`/`backgroundColor`/`width`/`height` etc.). Verify this actually does what's intended; likely a no-op silently ignored.

## 5. Improvements / Recommendations

1. **Schema validation + types for the parser AST.** Replace `Record<string, any>` casts with a TS-typed wrapper around `node-sql-parser`. Even a hand-written `type SqlAstNode = { type: string; [k: string]: unknown }` with narrowing functions would beat current casting.
2. **Deduplicate**: merge `getInlineReference`/`getTableLevelReference`; make `copyAsSQL` call `tablesToSQL`; export `TABLE_NODE_*` from one module.
3. **Fix the `filteredSchema` relationship filter**: keep rels where `sourceTable` OR `targetTable` is in the selected schema; this also fixes the synthetic-node UX.
4. **Drop the `setTimeout` in `handleLoadExample`** — synchronous `setSql` + `setSchema` is correct.
5. **Fix `isNotNull` early return** to `return false` (nullable) to match the documented contract.
6. **Replace `colorMode={'' as unknown as ColorMode}`** with an explicit `'system'`/`'dark'` value or wire to a theme toggle; remove the type-cast.
7. **Address the React Flow attribution**: either keep it visible (free license) or purchase Pro and document the entitlement. Don't ship `hideAttribution: true` as-is.
8. **Add lint/format**: `eslint` + `eslint-config-next` + `prettier`, plus a `lint` and `typecheck` script in `package.json` (currently none — AGENTS.md says to run them, but the project has no `lint` script). Add `"typecheck": "tsc --noEmit"` and `"lint": "next lint"`.
9. **Add tests**: `parseSql.ts` is the most important unit to lock down — fixture-driven tests with real Supabase DDL snippets would catch regressions in `node-sql-parser` upgrades (the AST shapes have changed across major versions and the code hardcodes structural assumptions). `tsx` is already a dev dep, ideal for a lightweight vitest setup.
10. **Remove create-next-app boilerplate**: delete `public/{next,vercel,file,globe,window}.svg`; rewrite `README.md` to describe the visualizer (usage, supported DDL, limitations like PG-only, missing table-level comments).
11. **Add table-level comment extraction** in `parseSql.ts` (the field is already plumbed through types) — `CREATE TABLE ... /* comment */` and `COMMENT ON TABLE` are both unhandled today.
12. **Centralize styles**: extract a `Button` component for the toolbar; replace the inline `className` tetris.
13. **Sharper exports**: render an off-screen clone of the graph at 1x with `html-to-image` rather than the live scaled viewport — sharper output and unaffected by user pan.
14. **Verify `html-to-image` options** — `includeStyleProperties` may be a no-op; consult current docs and align option names with the library.

---

### Prioritized fix order

| # | Item | Why |
|---|------|-----|
| 1 | `filteredSchema` filter bug (#3) | Correctness — silently drops relationships |
| 2 | `isNotNull` early return (#5) | Correctness — wrong nullable default |
| 3 | React Flow attribution (#7) | License compliance |
| 4 | Dedup ref helpers, copyAsSQL, constants (#2) | Maintenance |
| 5 | Lint + typecheck scripts (#8) | Tooling — needed for AGENTS.md workflow |
| 6 | Typed AST wrapper (#1) | Long-term safety |
| 7 | Parser tests (#9) | Lock down node-sql-parser version upgrades |
