<!-- BEGIN:nextjs-agent-rules -->
# Agent notes for schema-visualizer

This is **Next.js 16.2.9** + **React 19** + **Tailwind 4**. Do not assume pre-v16 Next.js APIs. The canonical reference for this install is `node_modules/next/dist/docs/`. Note that `next lint` is removed in v16; this project uses **Biome** (`@biomejs/biome`) as the primary linter and formatter, not ESLint.
<!-- END:nextjs-agent-rules -->

## What this repo is

App Router app with two main surfaces:

- `/` (`src/app/page.tsx`) — marketing landing page with an embedded interactive sample-schema visualizer.
- `/app` (`src/app/app/page.tsx`) — the visualizer where users paste their own PostgreSQL DDL and explore the generated ER diagram.

Both parse SQL with `node-sql-parser` and render diagrams with `@xyflow/react` + `@dagrejs/dagre`.

## Verified commands

- `npm run dev` — Turbopack dev server on http://localhost:3000
- `npm run build`
- `npm run start`
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` / `npm run test:watch` — Vitest
- `npm run lint` — `biome lint .` (linter only)
- `npm run lint:fix` — `biome lint . --write`
- `npm run format` — `biome format .` (formatter only, read-only)
- `npm run format:fix` — `biome format . --write`
- `npm run check` — `biome check .` (lint + format, read-only)
- `npm run check:fix` — `biome check . --write` (apply safe fixes)

Linter + formatter config lives in `biome.json`. `public/**` is excluded from the linter (static SVG assets from `create-next-app` boilerplate) but is still formatted if it contains source files. Per-file overrides exist for `src/lib/parseSql.ts` (allow `any` for `node-sql-parser` AST casts), `src/components/FindTableSelector.tsx` (allow `autoFocus` on the filter input), and `**/*.test.{ts,tsx}` / `**/__tests__/**` (allow `any` in tests).

## Architecture

- `src/app/page.tsx` is the marketing landing page; it embeds `SampleSchemaVisualizer` (a client component) below the hero section. The visualizer app lives at `src/app/app/page.tsx`. Layout/root is `src/app/layout.tsx`.
- `src/components/` — React Flow canvas, node/edge components, toolbar, context provider, export hook.
- `src/components/__tests__/` — Vitest + Testing Library tests for components.
- `src/lib/` — pure logic: `parseSql.ts`, `graph.ts`, `utils.ts`, `types.ts`, `sampleSchema.ts`, `constants.ts`, plus `*.test.ts` files.
- `src/test/setup.ts` — Vitest setup (registers `@testing-library/jest-dom`).
- `@/*` path alias resolves to `./src/*`.
- Tailwind 4 is configured in `postcss.config.mjs` via `@tailwindcss/postcss`.

## Known hazards

- `parseSql.ts` relies on `Record<string, any>` casts against `node-sql-parser` AST shapes. AST structure changes across parser versions; verify with real DDL when upgrading. Biome's `noExplicitAny` is disabled in this file and in tests.
- `src/app/page.tsx` is the marketing landing page; the visualizer app lives at `src/app/app/page.tsx`. The stale cross-schema FK filtering hazard that previously applied to `page.tsx` has been resolved in `/app/page.tsx` (relationships are filtered by both `sourceSchema` and `targetSchema`).
- `isNotNull()` in `parseSql.ts` has an inconsistent early return that returns `true` for non-object defs despite the nullable-default contract. See `AUDIT.md` §4.
- `SchemaGraphCanvas.tsx` uses `proOptions={{ hideAttribution: true }}`, which is **not allowed** under the free `@xyflow/react` license.
- `public/*.svg` are unreferenced `create-next-app` boilerplate; tracked for removal in `AUDIT.md` §6. The linter ignores `public/**` so these don't fail CI.

## Design Context

This project has a committed strategic + visual system. Read these files before doing design or copy work:

- `PRODUCT.md` — register, target users, product purpose, brand personality, anti-references, design principles, accessibility commitments. **Strategic answers live here.**
- `DESIGN.md` — color palette (OKLCH, light + dark), typography scale, spacing, components, motion, iconography, borders/elevation, z-index, accessibility. **Visual answers live here.** When a question is "what color/space/type/elevation", DESIGN.md wins.

When the two conflict on a design call, the design *intent* comes from PRODUCT.md (voice, anti-references, principles) and the *form* comes from DESIGN.md (specific tokens, sizes, components).

## References

- `AUDIT.md` — detailed code audit with prioritized fix list.
- `PHASE1_PLAN.md` — planned dead-code/tooling cleanup; verify current state before assuming it has been applied.
- Next 16 docs: `node_modules/next/dist/docs/` (trust these over external Next.js docs).
- Biome 2.5 schema: `https://biomejs.dev/schemas/2.5.0/schema.json` (referenced from `biome.json`).
