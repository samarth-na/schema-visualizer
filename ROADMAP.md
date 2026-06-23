# Schema Visualizer Remediation Roadmap

Created: 2026-06-23  
Related docs: `gpt5.5-report.md`, `AUDIT.md`, `fallow.md`, `PHASE1_PLAN.md`, `test.md`

## Short Answer: Start Here

**Phase 0**, **Phase 1**, **Phase 2**, and **Phase 3** are complete. Start with **Phase 4** next.

Completed change sets:

1. Removed React Flow `hideAttribution` and CSS override.
2. Added `typecheck` script.
3. Applied safe Fallow cleanup from `PHASE1_PLAN.md`.
4. Added Vitest, parser/utility/graph/component tests, and `isNotNull` fix.
5. Extended `ParsedRelationship` with schema fields, updated parser builders, schema filtering, schema-qualified graph IDs, and synthetic foreign nodes.
6. All validations pass (`npm run test`, `npm run typecheck`, `npm run build`, `npx fallow dead-code`).

Do **not** refactor `parseSql.ts` before Phase 2 tests exist.

## Roadmap Overview

| Phase | Theme | Risk | Status | Primary docs/sections to reference |
|:---|---:|---:|:---|---|
| 0 | Compliance + validation baseline | Low | ✅ Done | `AUDIT.md` §4 Correctness / Bugs; `gpt5.5-report.md` §High-Priority Findings |
| 1 | Safe Fallow cleanup | Low | ✅ Done | `PHASE1_PLAN.md` §Code Changes; `fallow.md` §Dead Code Findings; `AUDIT.md` §2 Bloat / Dead Code |
| 2 | Parser test foundation | Medium | ✅ Done | `test.md` §Priority 1 — Parser Tests; `AUDIT.md` §1 Cleanliness, §4 Correctness / Bugs |
| 3 | Multi-schema correctness | Medium/High | ✅ Done | `gpt5.5-report.md` §Cross-schema relationship filtering; `AUDIT.md` §4 Correctness / Bugs |
| 4 | Parser and graph refactor | Medium | ⬜ Next | `fallow.md` §Duplication Findings, §Health Findings; `test.md` §Priority 1–3 |
| 5 | UX hardening + docs/assets | Low/Medium | ⬜ | `gpt5.5-report.md` §Low-Priority Cleanup; `AUDIT.md` §6 Documentation / Assets |

---

## Phase 0 — Compliance and Baseline Validation

### Reference Docs

Read these before starting Phase 0:

- `ROADMAP.md` — §Phase 0 — Compliance and Baseline Validation, for the exact task order and exit criteria.
- `gpt5.5-report.md` — §High-Priority Findings and Detailed Suggested Changes → `React Flow attribution is hidden`, for the exact prop to remove.
- `AUDIT.md` — §4 Correctness / Bugs → `React Flow attribution is hidden`, for why this is the top compliance issue.
- `README.md` — §Available Commands and §Known Limitations, for current validation commands and documented constraints.

### Goal

Remove immediate non-code risk and make validation repeatable.

### Tasks

#### 0.1 Remove React Flow attribution override

File: `src/components/SchemaGraphCanvas.tsx`

Remove:

```tsx
proOptions={{ hideAttribution: true }}
```

Why:

- Hiding attribution is not allowed on the free `@xyflow/react` license unless React Flow Pro is licensed.

#### 0.2 Add `typecheck` script

File: `package.json`

Add:

```json
"typecheck": "tsc --noEmit"
```

Keep existing scripts:

```json
"dev": "next dev",
"build": "next build",
"start": "next start"
```

### Validation

```sh
npm run typecheck
npm run build
```

### Exit Criteria

- Build passes.
- Typecheck passes.
- React Flow attribution is no longer hidden.

---

## Phase 1 — Safe Fallow Cleanup

Detailed plan: `PHASE1_PLAN.md`

### Reference Docs

Read these before starting Phase 1:

- `PHASE1_PLAN.md` — §Goal, §Non-Goals, §Code Changes, and §Validation. Treat this as the authoritative implementation checklist.
- `fallow.md` — §Dead Code Findings for the exact unused exports, §Detailed Dead-Code Remediation for code snippets, and §Fix Preview for what **not** to apply blindly.
- `AUDIT.md` — §2 Bloat / Dead Code for the audit explanation of duplicate constants, SQL serialization, and unused type exports.
- `gpt5.5-report.md` — §Medium-Priority Findings → `Duplicate SQL serialization logic`, `Duplicate table node constants`, and §Suggested Implementation Phases → Phase 1.

### Goal

Reduce dead exports and duplicate constants without changing parser or graph behavior.

### Tasks

#### 1.1 Create shared constants module

Create `src/lib/constants.ts`:

```ts
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40
```

#### 1.2 Update `graph.ts`

File: `src/lib/graph.ts`

- Import constants from `./constants`.
- Remove exported local constants.

#### 1.3 Update `TableNode.tsx`

File: `src/components/TableNode.tsx`

- Import `TABLE_NODE_WIDTH` from `@/lib/constants`.
- Remove local `TABLE_NODE_WIDTH` / `TABLE_NODE_ROW_HEIGHT` exports.

#### 1.4 Use `tablesToSQL` in canvas

File: `src/components/SchemaGraphCanvas.tsx`

- Import `tablesToSQL` from `@/lib/utils`.
- Replace inline `copyAsSQL` SQL generation with `tablesToSQL(tables)`.

Note: copied SQL will now include defaults and identity clauses. This is intended.

#### 1.5 Remove internal-only exports

Files:

- `src/components/SchemaGraphContext.tsx`
- `src/lib/utils.ts`

Changes:

- Remove `export` from `SchemaGraphContext`.
- Remove `export` from `getTableDefinitionAsMarkdown`.

#### 1.6 Delete unused `ToolbarAction`

File: `src/lib/types.ts`

Remove the unused type export.

#### 1.7 Optional toolbar class cleanup

File: `src/components/Toolbar.tsx`

Extract repeated button class string into `toolbarButtonClass`.

### Validation

```sh
npm run typecheck
npm run build
npx fallow dead-code
```

### Exit Criteria

- Typecheck passes.
- Build passes.
- Fallow dead-code output is materially reduced.
- Duplicate export pair for table constants is gone.
- `tablesToSQL` is no longer reported as unused.

---

## Phase 2 — Parser Test Foundation

Detailed plan: `test.md`

### Reference Docs

Read these before starting Phase 2:

- `test.md` — §Recommended Framework, §Vitest Config, §Priority 1 — Parser Tests, and §Implementation Order. Treat this as the authoritative test checklist.
- `AUDIT.md` — §1 Cleanliness → `parseSql.ts relies heavily on Record<string, any>` and §4 Correctness / Bugs → `isNotNull default is wrong`.
- `gpt5.5-report.md` — §High-Priority Findings → `parseSql.ts is fragile and under-tested`, especially the Vitest setup and sample parser test snippets.
- `README.md` — §Available Commands, §What It Supports Today, and §Known Limitations, so tests match documented behavior.

### Goal

Add tests before changing parser behavior or relationship modeling.

### Tasks

#### 2.1 Install Vitest

```sh
npm install -D vitest
```

Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

#### 2.2 Add parser tests

Create `src/lib/parseSql.test.ts`.

Start with these cases:

1. Empty input.
2. Basic `CREATE TABLE`.
3. Nullable default and `NOT NULL`.
4. Inline primary key.
5. Table-level primary key.
6. Inline FK.
7. Table-level FK.
8. `ALTER TABLE` FK.
9. Default values.
10. Identity/serial columns.
11. Cross-schema references.
12. Same table name in multiple schemas — may initially expose current limitations.

#### 2.3 Add sample schema fixture test

Use `SAMPLE_SCHEMA` from `src/lib/sampleSchema.ts`.

Assert current table and relationship endpoints after verifying current sample contents.

### Validation

```sh
npm run test
npm run typecheck
npm run build
```

### Exit Criteria

- Parser tests run in CI/local command.
- Existing behavior is documented by tests.
- Known failing tests for future schema-qualified relationships are either skipped with clear TODOs or added during Phase 3.

### Completed Work

- Vitest 4.1.9 installed as a devDependency.
- `test` and `test:watch` scripts added to `package.json`.
- `vitest.config.ts` created with `@vitejs/plugin-react`, jsdom environment, `@/` alias, and `src/test/setup.ts` setup file.
- `src/test/setup.ts` registers `@testing-library/jest-dom`.
- `src/lib/parseSql.test.ts` contains 20 tests covering all cases from §Priority 1.
- `src/lib/utils.test.ts` covers `cn`, `getSchemaAsMarkdown`, and `tablesToSQL`.
- `src/lib/graph.test.ts` covers empty/single-table/FK cases, synthetic foreign nodes, dedup, schema-qualified IDs, and dagre layout.
- `src/app/page.test.tsx` and `src/components/__tests__/` cover page interactions and component rendering.
- `isNotNull` early-return bug fixed in `src/lib/parseSql.ts:53` (now returns `false`).
- `npm run test` passes: 46 tests across 9 files.

---

## Phase 3 — Multi-Schema Correctness

### Reference Docs

Read these before starting Phase 3:

- `gpt5.5-report.md` — §High-Priority Findings → `Cross-schema relationship filtering is incorrect`, `Relationship model omits source/target schema names`, and §Suggested Implementation Phases → Phase 3.
- `AUDIT.md` — §4 Correctness / Bugs → `Cross-schema relationship filtering is incorrect`, `Relationship model omits schema names`, and `Synthetic foreign node labels are confusing`.
- `test.md` — §Priority 1 — Parser Tests → `Cross-schema references` and `Same table name in different schemas`.
- `fallow.md` — §Health Findings and §Highest-Complexity Functions, to avoid mixing broad parser/graph refactors into this correctness phase.

### Goal

Fix the most important correctness issue: schema-aware relationships and filtering.

### Tasks

#### 3.1 Extend relationship type

File: `src/lib/types.ts`

Change `ParsedRelationship` to include schemas:

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

#### 3.2 Update parser relationship builders

File: `src/lib/parseSql.ts`

Add `sourceSchema` and `targetSchema` in:

- Inline FK relationships.
- Table-level FK relationships.
- `ALTER TABLE` FK relationships.

#### 3.3 Fix selected-schema filtering

File: `src/app/page.tsx`

Use schema fields:

```ts
relationships: schema.relationships.filter(
  (r) => r.sourceSchema === selectedSchema || r.targetSchema === selectedSchema
)
```

If schema fields are not ready yet, use the minimal endpoint table lookup described in `AUDIT.md`.

#### 3.4 Update graph IDs

File: `src/lib/graph.ts`

Use schema-qualified IDs:

```ts
const getTableId = (schema: string, table: string) => `${schema}.${table}`
```

Update:

- Node IDs.
- Column handle IDs.
- Table lookup maps.
- Edge `source` and `target`.
- `findTable` behavior in `SchemaGraphCanvas.tsx` / `FindTableSelector.tsx` if needed.

#### 3.5 Fix synthetic foreign nodes

File: `src/lib/graph.ts`

Use real `rel.targetSchema` and `rel.targetTable` instead of guessing schema from table name.

### Validation

```sh
npm run test
npm run typecheck
npm run build
```

Manual checks:

1. Render the built-in sample schema.
2. Render schema with `auth.users` and `public.profiles` FK.
3. Switch schema selection and verify relationships remain visible where expected.
4. Render same table name in two schemas and confirm graph nodes do not collide.

### Exit Criteria

- Cross-schema FK tests pass.
- Same-name tables in different schemas do not collide.
- Schema filter keeps relationships when either endpoint belongs to selected schema.

### Completed Work

- `src/lib/types.ts` `ParsedRelationship` extended with `sourceSchema` and `targetSchema` (lines 15, 18).
- `src/lib/parseSql.ts` sets schema fields in all three relationship builders (inline at lines 286, 289; table-level at lines 340, 343; `ALTER TABLE` at lines 386, 389).
- `src/app/page.tsx:82` filters relationships by `r.sourceSchema === selectedSchema || r.targetSchema === selectedSchema`.
- `src/lib/graph.ts` uses schema-qualified table keys throughout: node IDs (line 51), column handles (line 40), edge source/target (lines 72, 73), and lookup maps (lines 24, 28).
- `src/lib/graph.ts:85-86` uses `rel.targetSchema` and `rel.targetTable` for synthetic foreign nodes instead of guessing the schema.
- Cross-schema and same-name tests added to `parseSql.test.ts` (lines 241-291) and `graph.test.ts` (lines 50-73, 104-131).
- Schema-filtering behavior asserted in `page.test.tsx:75-103`.
- `npm run test` passes: 46 tests across 9 files.

---

## Phase 4 — Parser and Graph Refactor

### Reference Docs

Read these before starting Phase 3:

- `gpt5.5-report.md` — §High-Priority Findings → `Cross-schema relationship filtering is incorrect`, `Relationship model omits source/target schema names`, and §Suggested Implementation Phases → Phase 3.
- `AUDIT.md` — §4 Correctness / Bugs → `Cross-schema relationship filtering is incorrect`, `Relationship model omits schema names`, and `Synthetic foreign node labels are confusing`.
- `test.md` — §Priority 1 — Parser Tests → `Cross-schema references` and `Same table name in different schemas`.
- `fallow.md` — §Health Findings and §Highest-Complexity Functions, to avoid mixing broad parser/graph refactors into this correctness phase.

### Goal

Fix the most important correctness issue: schema-aware relationships and filtering.

### Tasks

#### 3.1 Extend relationship type

File: `src/lib/types.ts`

Change `ParsedRelationship` to include schemas:

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

#### 3.2 Update parser relationship builders

File: `src/lib/parseSql.ts`

Add `sourceSchema` and `targetSchema` in:

- Inline FK relationships.
- Table-level FK relationships.
- `ALTER TABLE` FK relationships.

#### 3.3 Fix selected-schema filtering

File: `src/app/page.tsx`

Use schema fields:

```ts
relationships: schema.relationships.filter(
  (r) => r.sourceSchema === selectedSchema || r.targetSchema === selectedSchema
)
```

If schema fields are not ready yet, use the minimal endpoint table lookup described in `AUDIT.md`.

#### 3.4 Update graph IDs

File: `src/lib/graph.ts`

Use schema-qualified IDs:

```ts
const getTableId = (schema: string, table: string) => `${schema}.${table}`
```

Update:

- Node IDs.
- Column handle IDs.
- Table lookup maps.
- Edge `source` and `target`.
- `findTable` behavior in `SchemaGraphCanvas.tsx` / `FindTableSelector.tsx` if needed.

#### 3.5 Fix synthetic foreign nodes

File: `src/lib/graph.ts`

Use real `rel.targetSchema` and `rel.targetTable` instead of guessing schema from table name.

### Validation

```sh
npm run test
npm run typecheck
npm run build
```

Manual checks:

1. Render the built-in sample schema.
2. Render schema with `auth.users` and `public.profiles` FK.
3. Switch schema selection and verify relationships remain visible where expected.
4. Render same table name in two schemas and confirm graph nodes do not collide.

### Exit Criteria

- Cross-schema FK tests pass.
- Same-name tables in different schemas do not collide.
- Schema filter keeps relationships when either endpoint belongs to selected schema.

---

## Phase 4 — Parser and Graph Refactor

### Reference Docs

Read these before starting Phase 4:

- `fallow.md` — §Duplication Findings for clone IDs, §Detailed Duplication Remediation for helper examples, §Health Findings for complexity targets, and §Fallow Refactoring Targets for priority order.
- `AUDIT.md` — §1 Cleanliness → duplicate reference helpers, §3 Performance → graph construction concerns, and §7 Prioritized Fix Order.
- `test.md` — §Priority 1 — Parser Tests, §Priority 2 — Utility Tests, and §Priority 3 — Graph Tests. These tests must stay green throughout refactor.
- `gpt5.5-report.md` — §Medium-Priority Findings → `Duplicate reference helper functions`, and §Suggested Implementation Phases → Phase 4.

### Goal

Reduce complexity and duplication after tests protect behavior.

### Tasks

#### 4.1 Merge duplicate reference helpers

File: `src/lib/parseSql.ts`

Replace `getInlineReference` and `getTableLevelReference` with `getReferenceInfo`.

#### 4.2 Extract shared FK relationship builder

File: `src/lib/parseSql.ts`

Extract duplicated relationship-building blocks reported by Fallow:

- `src/lib/parseSql.ts:314-333`
- `src/lib/parseSql.ts:357-376`

#### 4.3 Split `parseSql`

Suggested helpers:

- `parseStatements`
- `parseCreateTableStatement`
- `collectTableConstraints`
- `parseColumnDefinition`
- `parseCreateTableForeignKeys`
- `parseAlterTableForeignKeys`

#### 4.4 Improve AST narrowing

Replace broad `Record<string, any>` casts incrementally with small guards and local helper types.

#### 4.5 Split graph construction helpers

File: `src/lib/graph.ts`

Suggested helpers:

- `buildTableNodes`
- `buildColumnMaps`
- `buildRelationshipEdges`
- `addSyntheticForeignNode`
- `layoutGraph`

### Validation

```sh
npm run test
npm run typecheck
npm run build
npx fallow health
npx fallow dupes
```

### Exit Criteria

- Parser tests still pass.
- Fallow duplication in `parseSql.ts` is reduced or gone.
- `parseSql` complexity is lower.
- Graph behavior remains unchanged except for intended schema correctness.

---

## Phase 5 — UX Hardening and Cleanup

### Reference Docs

Read these before starting Phase 5:

- `gpt5.5-report.md` — §Medium-Priority Findings → `Clipboard failures are silent`, `Export-to-image implementation needs verification`, and §Low-Priority Cleanup → `Add error boundary` / asset cleanup.
- `AUDIT.md` — §4 Correctness / Bugs → no error boundary and export concerns, plus §6 Documentation / Assets for public SVG cleanup.
- `README.md` — §Known Limitations, §Available Commands, and §Reports and Plans. Update these if limitations, scripts, or assets change.
- `fallow.md` — §Recommended Action Plan and §Notes, then re-run full `npx fallow` after cleanup.

### Goal

Improve production polish after core correctness and maintainability are addressed.

### Tasks

#### 5.1 Add error boundary

Create `src/app/error.tsx`.

Use the implementation sketch in `gpt5.5-report.md` / `AUDIT.md`.

#### 5.2 Improve clipboard errors

File: `src/lib/utils.ts`

Make `copyToClipboard` return a boolean or accept an `onError` callback. Show failure toast at call sites.

#### 5.3 Improve export-to-image errors

File: `src/components/useExportSchemaToImage.ts`

Use safer error message handling:

```ts
const message = error instanceof Error ? error.message : 'Unknown export error'
toast.error(`Failed to download ${format.toUpperCase()}: ${message}`)
```

#### 5.4 Verify export behavior

Manual QA:

- Light mode.
- Dark mode.
- Zoomed in.
- Zoomed out.
- Panned canvas.
- Large schema.
- PNG and SVG.

#### 5.5 Remove unused public assets

Confirm unreferenced first:

```sh
grep -R "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" -n src public README.md
```

Then remove unused create-next-app SVGs.

### Validation

```sh
npm run test
npm run typecheck
npm run build
npx fallow
```

### Exit Criteria

- App has an error boundary.
- Clipboard and export failures are visible to users.
- Unused public assets are removed or intentionally kept.
- Full validation passes or remaining findings are documented.

---

## Suggested PR / Commit Breakdown

If you want clean reviewable chunks, use this order:

1. `docs: add remediation roadmap` — this file.
2. `fix: restore react flow attribution and add typecheck script`.
3. `refactor: centralize table layout constants`.
4. `refactor: dedupe SQL serialization and internal exports`.
5. `chore: add eslint config for next 16`.
6. `test: add parser regression tests`.
7. `fix: add schema-aware relationships`.
8. `refactor: split parser foreign key helpers`.
9. `refactor: simplify graph construction`.
10. `feat: add error boundary and improve failure toasts`.
11. `chore: remove unused public assets`.

## What Not To Do First

Avoid these as first steps:

- Do not refactor `parseSql.ts` before tests.
- Do not run `fallow fix` directly; use the plan in `fallow.md` / `PHASE1_PLAN.md`.
- Do not add schema-qualified graph IDs without updating tests and `findTable` behavior.
- Do not use `next lint`; Next.js 16 removed it.
- Do not delete public assets without confirming they are unreferenced.

## One-Week Practical Plan

If working in short daily sessions:

### Day 1 ✅

- Phase 0.
- Start Phase 1 constants cleanup.

### Day 2 ✅

- Finish Phase 1.
- Re-run Fallow.

### Day 3 ✅

- Install Vitest.
- Add basic parser tests.

### Day 4 ✅

- Add FK/default/identity/cross-schema parser tests.
- Fix `isNotNull` once covered.

### Day 5 ✅

- Add schema fields to `ParsedRelationship`.
- Update parser and page filtering.

### Day 6 ✅

- Update graph IDs and synthetic foreign nodes.
- Manual multi-schema validation.

### Day 7

- Refactor duplicated parser helpers if tests are green.
- Update docs with completed status.

## Status Tracker

| Phase | Status | Notes |
|:---|:---|---|
| 0 | ✅ Done | Attribution restored, typecheck script added. |
| 1 | ✅ Done | Constants centralized, internal exports removed, `tablesToSQL` in use, `ToolbarAction` deleted, toolbar class deduped. Fallow dead-code: 0 issues. |
| 2 | ✅ Done | Vitest installed; 46 tests across 9 files covering parser, utils, graph, page, and components. `isNotNull` fix landed. |
| 3 | ✅ Done | `ParsedRelationship` carries `sourceSchema`/`targetSchema`; parser, page filter, graph IDs, and synthetic foreign nodes all schema-aware. |
| 4 | ⬜ Not started | Next. Depends on Phase 2/3 tests staying green. |
| 5 | ⬜ Not started | Can be partially parallel after Phase 1. |
