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
npm install
```

Run the development server:

```sh
npm run dev
```

Open http://localhost:3000.

## Available Commands

```sh
npm run dev      # Start the Turbopack dev server
npm run build    # Create a production build
npm run start    # Start the production server after build
npx tsc --noEmit # Type-check the project
```

There are currently no `lint` or `test` scripts in `package.json`.

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

- Cross-schema relationship filtering currently needs correction.
- `ParsedRelationship` does not yet store source/target schema names.
- `parseSql.ts` depends on fragile `node-sql-parser` AST shapes and has no regression tests yet.
- React Flow attribution must not be hidden unless the project has a valid Pro entitlement.
- Export-to-image behavior should be manually verified for large, zoomed, or panned graphs.
- README/public assets were originally create-next-app boilerplate; this README has been updated, but unused public SVGs may still be removable.

## Project Structure

```txt
src/app/
  layout.tsx       # Root layout
  page.tsx         # Main client page
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

- This is Next.js 16. Do not use `next lint`; Next 16 uses the ESLint CLI with `eslint-config-next` flat config.
- Tailwind 4 is configured through `postcss.config.mjs` and `@tailwindcss/postcss`.
- The `@/*` path alias resolves to `./src/*`.
- Add parser tests before refactoring `src/lib/parseSql.ts`.

## Reports and Plans

- `gpt5.5-report.md` — detailed GPT-5.5 codebase review with suggested changes.
- `fallow.md` — Fallow dead-code, duplication, and health findings.
- `AUDIT.md` — earlier detailed audit.
- `PHASE1_PLAN.md` — focused dead-code/tooling cleanup plan.

## Recommended Next Steps

1. Remove `proOptions={{ hideAttribution: true }}` from the React Flow canvas unless React Flow Pro is licensed.
2. Add `typecheck`, `lint`, and `test` scripts.
3. Add parser regression tests.
4. Extend relationships to include source/target schema names.
5. Fix selected-schema relationship filtering.
6. Apply safe Fallow cleanup: constants, unused type exports, internal-only exports, and duplicated SQL serialization.
