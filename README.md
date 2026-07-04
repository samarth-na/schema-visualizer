# Schema Visualizer

A single-page Next.js app for turning PostgreSQL DDL into an interactive ER diagram.

Paste `CREATE TABLE` / foreign-key DDL, click **Render Graph**, and explore the generated schema graph powered by React Flow and dagre layout.

## Stack

- Next.js 16.2.9 App Router
- React 19.2.4
- Tailwind CSS 4
- `node-sql-parser` for PostgreSQL DDL parsing
- `@xyflow/react` for graph rendering
- `@dagrejs/dagre` for auto-layout
- `html-to-image` for PNG/SVG export

## Getting Started

Install dependencies:

```sh
bun install
```

Run the development server:

```sh
bun run dev
```

Open http://localhost:3000.

## Available Commands

```sh
bun run dev       # Start the Turbopack dev server
bun run build     # Create a production build
bun run start     # Start the production server after build
bun run typecheck # Type-check the project
bun run test      # Run Vitest
bun run check     # Run Biome lint + format checks
```

## What It Supports Today

The parser is focused on PostgreSQL-style DDL and currently handles common cases such as:

- `CREATE TABLE`
- Schema-qualified table names like `public.users`
- Column names and data types
- Primary keys
- Unique columns/table constraints
- Nullable vs. `NOT NULL` columns
- Default values, best-effort
- Identity/serial-like columns, best-effort
- Inline foreign keys
- Table-level foreign keys
- `ALTER TABLE ... ADD ... FOREIGN KEY`, best-effort

## Known Limitations

See `gpt5.5-report.md`, `fallow.md`, and `AUDIT.md` for detailed findings. Important limitations include:

- `parseSql.ts` depends on fragile `node-sql-parser` AST shapes; keep regression tests green before refactoring parser logic.
- Export-to-image behavior should be manually verified for large, zoomed, or panned graphs.
- README/public assets were originally create-next-app boilerplate; this README has been updated, but unused public SVGs may still be removable.

## Project Structure

```txt
src/app/
  layout.tsx       # Root layout
  page.tsx         # Marketing landing page
  app/page.tsx     # Visualizer app
  globals.css      # Global styles

src/components/
  SchemaGraphCanvas.tsx       # Main React Flow canvas
  TableNode.tsx                # Table node renderer
  DefaultEdge.tsx              # Relationship edge renderer
  Toolbar.tsx                  # Canvas toolbar
  FindTableSelector.tsx        # Table finder
  SchemaGraphContext.tsx       # Canvas context
  SchemaGraphLegend.tsx        # Legend
  useExportSchemaToImage.ts    # PNG/SVG export hook

src/lib/
  parseSql.ts       # SQL DDL parser
  graph.ts          # React Flow graph/layout generation
  types.ts          # Shared types
  utils.ts          # Utility functions/export formatting
  sampleSchema.ts   # Built-in example schema
```

## Development Notes

- Use Bun for package management and scripts. `bun.lock` is the lockfile.
- This is Next.js 16. Linting and formatting are handled by Biome (`biome.json`); use `bun run check` / `bun run check:fix`.
- Tailwind 4 is configured through `postcss.config.mjs` and `@tailwindcss/postcss`.
- The `@/*` path alias resolves to `./src/*`.
- Add parser tests before refactoring `src/lib/parseSql.ts`.

## Reports and Plans

- `gpt5.5-report.md` — detailed GPT-5.5 codebase review with suggested changes.
- `fallow.md` — Fallow dead-code, duplication, and health findings.
- `AUDIT.md` — earlier detailed audit.
- `PHASE1_PLAN.md` — focused dead-code/tooling cleanup plan.

## Recommended Next Steps

1. Clear current Fallow dead-code findings.
2. Start Phase 4 from `ROADMAP.md`: parser helper dedupe and graph construction refactors.
3. Keep `bun run test`, `bun run typecheck`, and `bun run build` green after each small change.
