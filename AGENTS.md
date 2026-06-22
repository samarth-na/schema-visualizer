<!-- BEGIN:nextjs-agent-rules -->
# Agent notes for schema-visualizer

This is **Next.js 16.2.9** + **React 19** + **Tailwind 4**. Do not assume pre-v16 Next.js APIs. The canonical reference for this install is `node_modules/next/dist/docs/` — for example, `next lint` is removed in v16 and ESLint is invoked directly with `eslint-config-next`'s flat config.
<!-- END:nextjs-agent-rules -->

## What this repo is

Single-page App Router app that parses PostgreSQL DDL with `node-sql-parser` and renders an interactive ER diagram with `@xyflow/react` + `@dagrejs/dagre`.

## Verified commands

- `npm run dev` — Turbopack dev server on http://localhost:3000
- `npm run build`
- `npm run start`
- `npx tsc --noEmit` — type check (no script in `package.json` yet)

There are **no `lint` or `test` scripts** currently. If you add linting, install `eslint` + `eslint-config-next` and use the flat-config pattern from `node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md` (`next lint` no longer exists).

## Architecture

- `src/app/page.tsx` is the only page and is a client component (`'use client'`); layout/root is `src/app/layout.tsx`.
- `src/components/` — React Flow canvas, node/edge components, toolbar, context provider, export hook.
- `src/lib/` — pure logic: `parseSql.ts`, `graph.ts`, `utils.ts`, `types.ts`, `sampleSchema.ts`.
- `@/*` path alias resolves to `./src/*`.
- Tailwind 4 is configured in `postcss.config.mjs` via `@tailwindcss/postcss`.

## Known hazards

- `README.md` is unmodified `create-next-app` boilerplate. Trust `package.json`, source code, `AUDIT.md`, and `PHASE1_PLAN.md` over it.
- `parseSql.ts` relies on `Record<string, any>` casts against `node-sql-parser` AST shapes. AST structure changes across parser versions; verify with real DDL when upgrading.
- `page.tsx` filters relationships incorrectly for cross-schema FKs (only checks `sourceTable`), so relationships whose target is in the selected schema but source is not get dropped. See `AUDIT.md` §4.
- `isNotNull()` in `parseSql.ts` has an inconsistent early return that returns `true` for non-object defs despite the nullable-default contract. See `AUDIT.md` §4.
- `SchemaGraphCanvas.tsx` uses `proOptions={{ hideAttribution: true }}`, which is **not allowed** under the free `@xyflow/react` license.
- No tests, no error boundary, no formatter config; code style is inconsistent between files.

## References

- `AUDIT.md` — detailed code audit with prioritized fix list.
- `PHASE1_PLAN.md` — planned dead-code/tooling cleanup; verify current state before assuming it has been applied.
- Next 16 docs: `node_modules/next/dist/docs/` (trust these over external Next.js docs).
