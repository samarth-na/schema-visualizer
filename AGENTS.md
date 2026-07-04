<!-- BEGIN:nextjs-agent-rules -->
# Agent notes for schema-visualizer

This is **Next.js 16.2.9** + **React 19** + **Tailwind 4**. Do not assume pre-v16 Next.js APIs. The canonical reference for this install is `node_modules/next/dist/docs/`. This project uses **Biome** (`@biomejs/biome`) as the only linter and formatter.
<!-- END:nextjs-agent-rules -->

## What this repo is

App Router app with two main surfaces:

- `/` (`src/app/page.tsx`) — marketing landing page built from `src/components/landing/*`.
- `/app` (`src/app/app/page.tsx`) — the visualizer where users paste their own PostgreSQL DDL and explore the generated ER diagram.

Both parse SQL with `node-sql-parser` and render diagrams with `@xyflow/react` + `@dagrejs/dagre`.

## Verified commands

- `bun run dev` — Turbopack dev server on http://localhost:3000
- `bun run build`
- `bun run start`
- `bun run typecheck` — `tsc --noEmit`
- `bun run test` / `bun run test:watch` — Vitest
- `bun run lint` — `biome lint .` (linter only)
- `bun run lint:fix` — `biome lint . --write`
- `bun run format` — `biome format .` (formatter only, read-only)
- `bun run format:fix` — `biome format . --write`
- `bun run check` — `biome check .` (lint + format, read-only)
- `bun run check:fix` — `biome check . --write` (apply safe fixes)

Linter + formatter config lives in `biome.json`. `public/**` is excluded from the linter (static SVG assets from `create-next-app` boilerplate) but is still formatted if it contains source files. Per-file overrides exist for `src/lib/parseSql.ts` (allow `any` for `node-sql-parser` AST casts), `src/components/FindTableSelector.tsx` (allow `autoFocus` on the filter input), and `**/*.test.{ts,tsx}` / `**/__tests__/**` (allow `any` in tests).

Current validation baseline:

- `bun run test` passes: 64 tests across 10 files.
- `bun run typecheck` passes.
- `bunx fallow dead-code` currently reports known cleanup work:
  - unused file: `src/components/SampleSchemaVisualizer.tsx`
  - unused exports: `AUTHORS_TABLE_SQL`, `POSTS_RELATIONS_SQL`, `ANNOTATED_CALLOUTS`, `getDefaultSchemaForDialect`

## Architecture

- `src/app/page.tsx` is the marketing landing page. The visualizer app lives at `src/app/app/page.tsx`. Layout/root is `src/app/layout.tsx`.
- `src/components/` — React Flow canvas, node/edge components, toolbar, context provider, export hook.
- `src/components/__tests__/` — Vitest + Testing Library tests for components.
- `src/lib/` — pure logic: `parseSql.ts`, `graph.ts`, `utils.ts`, `types.ts`, `sampleSchema.ts`, `constants.ts`, plus `*.test.ts` files.
- `src/test/setup.ts` — Vitest setup (registers `@testing-library/jest-dom`).
- `@/*` path alias resolves to `./src/*`.
- Tailwind 4 is configured in `postcss.config.mjs` via `@tailwindcss/postcss`.

## Known hazards

- `parseSql.ts` relies on `Record<string, any>` casts against `node-sql-parser` AST shapes. AST structure changes across parser versions; verify with real DDL when upgrading. Biome's `noExplicitAny` is disabled in this file and in tests.
- Multi-schema relationship correctness has been implemented: `ParsedRelationship` carries `sourceSchema`/`targetSchema`, `/app` filters relationships by those fields, graph node IDs are schema-qualified, and synthetic foreign nodes use target schema/table data.
- `isNotNull()` has been fixed to treat missing/non-object metadata as nullable. Keep parser tests green before changing this area.
- React Flow attribution is no longer hidden. Do not reintroduce `proOptions={{ hideAttribution: true }}` unless the project has a paid entitlement.
- `handleLoadExample` in `src/app/app/page.tsx` still uses an unnecessary `setTimeout`; this is a small cleanup item from `AUDIT.md`.
- `public/*.svg` are unreferenced `create-next-app` boilerplate; tracked for removal in `AUDIT.md` §6. The linter ignores `public/**` so these don't fail CI.

## Roadmap Status

- `ROADMAP.md` is the current source of truth.
- Phases 0, 1, 2, and 3 are complete.
- Before starting Phase 4, clear the current Fallow dead-code findings listed above.
- Next substantive work is Phase 4: merge duplicate parser reference helpers, extract the shared FK relationship builder, split `parseSql`/graph construction helpers, and keep tests/typecheck/build green after each small refactor.
- Phase 5 remains UX hardening: app error boundary, clipboard/export error UX, export verification, and unused public asset removal.

## Design Context

This project has a committed strategic + visual system. Read these files before doing design or copy work:

- `PRODUCT.md` — register, target users, product purpose, brand personality, anti-references, design principles, accessibility commitments. **Strategic answers live here.**
- `DESIGN.md` — color palette (OKLCH, light + dark), typography scale, spacing, components, motion, iconography, borders/elevation, z-index, accessibility. **Visual answers live here.** When a question is "what color/space/type/elevation", DESIGN.md wins.

When the two conflict on a design call, the design *intent* comes from PRODUCT.md (voice, anti-references, principles) and the *form* comes from DESIGN.md (specific tokens, sizes, components).

## References

- `ROADMAP.md` — current phase status and next-step order.
- `AUDIT.md` — detailed code audit with prioritized fix list.
- `PHASE1_PLAN.md` — historical Phase 1 cleanup plan; most items are already applied.
- Next 16 docs: `node_modules/next/dist/docs/` (trust these over external Next.js docs).
- Biome 2.5 schema: `https://biomejs.dev/schemas/2.5.0/schema.json` (referenced from `biome.json`).
