# Test Plan — Schema Visualizer

## Recommended framework

**Vitest** + **@testing-library/react** + **jsdom**

`tsx` is already a devDependency, so Node can run TypeScript tests without extra transpiler setup.
Vitest has first-class Next.js support and lets you test both pure `lib/` modules and React components.

### Install

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### Scripts to add to `package.json`

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:run": "vitest run"
```

---

## Priority 1 — `src/lib/parseSql.test.ts`

Lock down the most fragile part of the codebase: the `node-sql-parser` integration.

### 1. Empty / invalid input

```ts
parseSql('')       → { tables: [], relationships: [] }
parseSql('   \n ') → { tables: [], relationships: [] }
parseSql('SELECT 1;') → { tables: [], relationships: [] }
```

### 2. Basic `CREATE TABLE`

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
```

| Assertion | Expected |
|---|---|
| `tables.length` | 1 |
| `tables[0].name` | `'users'` |
| `tables[0].schema` | `'public'` |
| `columns[0].name` | `'id'` |
| `columns[0].dataType` | `'INT'` |
| `columns[0].isPrimaryKey` | `true` |
| `columns[0].isNullable` | `true` (no `NOT NULL` → nullable) |
| `columns[1].name` | `'name'` |
| `columns[1].dataType` | `'VARCHAR(255)'` |
| `columns[1].isNullable` | `false` |

### 3. Nullable defaults and `NOT NULL`

```sql
CREATE TABLE t (a TEXT, b TEXT NOT NULL);
```

| Assertion | Expected |
|---|---|
| `columns[0].isNullable` | `true` |
| `columns[1].isNullable` | `false` |

Catches the `isNotNull` early-return inconsistency (`parseSql.ts:49`).

### 4. Identity / serial columns

```sql
CREATE TABLE t (
  id SERIAL PRIMARY KEY,
  big_id BIGSERIAL PRIMARY KEY
);
```

| Assertion | Expected |
|---|---|
| `id.isIdentity` | `true` |
| `big_id.isIdentity` | `true` |

### 5. Data types with lengths

```sql
CREATE TABLE t (
  a DECIMAL(10, 2),
  b VARCHAR(100),
  c CHAR
);
```

| Assertion | Expected |
|---|---|
| `a.dataType` | `'DECIMAL(10, 2)'` |
| `b.dataType` | `'VARCHAR(100)'` |
| `c.dataType` | `'CHAR'` |

### 6. Default values

```sql
CREATE TABLE t (
  ts TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT FALSE,
  count INT DEFAULT 0,
  label VARCHAR DEFAULT 'none'
);
```

All four columns have a non-null `defaultValue`.

### 7. Inline foreign key

```sql
CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id)
);
```

| Assertion | Expected |
|---|---|
| `relationships.length` | 1 |
| `relationships[0].sourceTable` | `'posts'` |
| `relationships[0].sourceColumn` | `'user_id'` |
| `relationships[0].targetTable` | `'users'` |
| `relationships[0].targetColumn` | `'id'` |
| `relationships[0].constraintName` | `'posts_user_id_fkey'` |

### 8. Table-level multi-column constraint

```sql
CREATE TABLE post_tags (
  post_id INT,
  tag_id INT,
  PRIMARY KEY (post_id, tag_id),
  UNIQUE (post_id)
);
```

| Assertion | Expected |
|---|---|
| `post_id.isPrimaryKey` | `true` |
| `tag_id.isPrimaryKey` | `true` |
| `post_id.isUnique` | `true` |
| `relationships.length` | 0 |

### 9. Table-level foreign key constraint

```sql
CREATE TABLE comments (
  id INT PRIMARY KEY,
  post_id INT,
  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

| Assertion | Expected |
|---|---|
| `relationships[0].constraintName` | `'fk_post'` |
| `relationships[0].sourceColumn` | `'post_id'` |
| `relationships[0].targetColumn` | `'id'` |

### 10. `ALTER TABLE ADD FOREIGN KEY`

```sql
CREATE TABLE orders (id INT PRIMARY KEY);
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (id) REFERENCES users(id);
```

| Assertion | Expected |
|---|---|
| `tables.length` | 1 |
| `relationships[0].sourceTable` | `'orders'` |
| `relationships[0].targetTable` | `'users'` |

### 11. Cross-schema references

```sql
CREATE SCHEMA app;
CREATE TABLE app.authors (id INT PRIMARY KEY);
CREATE TABLE app.posts (
  id INT PRIMARY KEY,
  author_id INT REFERENCES app.authors(id)
);
```

| Assertion | Expected |
|---|---|
| `app.authors.schema` | `'app'` |
| `app.posts.schema` | `'app'` |
| Relationship target table | `'authors'` |
| Relationship target column | `'id'` |

### 12. Quoted identifiers

```sql
CREATE TABLE "my-schema"."User" (
  "ID" INT PRIMARY KEY
);
```

| Assertion | Expected |
|---|---|
| Table name | `'User'` (quotes stripped) |
| Schema | `'my-schema'` (quotes stripped) |
| Column name | `'ID'` (quotes stripped) |

### 13. Multiple schemas

```sql
CREATE TABLE public.a (id INT PRIMARY KEY);
CREATE TABLE app.b (id INT PRIMARY KEY);
```

Both tables returned with correct `schema` fields (`'public'` and `'app'`).

### 14. `formatParseError` helper

```ts
formatParseError(new Error('syntax error'))       → 'syntax error'
formatParseError('bad')                            → 'bad'
formatParseError(null)                             → 'Failed to parse SQL. Please check your syntax.'
```

### 15. End-to-end with the existing sample schema

Use `SAMPLE_SCHEMA` from `src/lib/sampleSchema.ts` as a real-world fixture and assert:

| Assertion | Expected |
|---|---|
| `tables.length` | 5 |
| Table names | `['authors', 'posts', 'tags', 'post_tags', 'comments']` |
| `relationships.length` | 4 |
| `app.posts.author_id` references `app.authors.id` | Relationship present |
| `app.post_tags.post_id` references `app.posts.id` | Relationship present |
| `app.post_tags.tag_id` references `app.tags.id` | Relationship present |
| `app.comments.post_id` references `app.posts.id` | Relationship present |

---

## Priority 2 — `src/lib/utils.test.ts`

| Test | What to assert |
|---|---|
| `cn('flex', 'hidden')` | `'hidden'` overrides `'flex'` |
| `cn('px-4', 'px-2')` | Conflict resolved via `twMerge` |
| `cn(false && 'hidden')` | Falsy values omitted |
| `getTableDefinitionAsMarkdown` with basic table | Correct headings, column rows, backtick/pipe escaping |
| `getSchemaAsMarkdown` with 2 schemas | Only the matching schema is included |
| `tablesToSQL` | Round-trip: output contains table name, column names, types, `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `GENERATED ALWAYS AS IDENTITY`, `DEFAULT` |

---

## Priority 3 — `src/lib/graph.test.ts`

May need to mock `@dagrejs/dagre` or mark as a pure structural test.

| Test | What to assert |
|---|---|
| Empty tables | `{ nodes: [], edges: [] }` |
| One table, no relationships | 1 node, 0 edges |
| Two tables with FK | 2 nodes, 1 edge with matching `sourceHandle`/`targetHandle` |
| Cross-schema FK → synthetic node | Node created for the missing target |
| Duplicate relationship IDs | Deduplicated via the `uniqueRels` map (only one edge emitted) |
| Dagre layout runs without error | Node positions are set after layout |

---

## Priority 4 — Component tests

Using `@testing-library/react`. Requires mocking `@xyflow/react` hooks, `navigator.clipboard`, and `sonner`.

| Component | Test | Assertion |
|---|---|---|
| `Home` page | Paste SQL, click **Render** | Schema state updated, toast shown, schema selector appears |
| `Home` page | Empty input | **Render** button disabled |
| `Home` page | Click **Load example** | Textarea populated, schema state set, toast shown |
| `Home` page | Select schema from dropdown | Only matching tables/relationships passed to canvas |
| `Home` page | Click **Clear** | SQL cleared, schema reset, error cleared |
| `FindTableSelector` | Type in filter | Only matching tables shown |
| `FindTableSelector` | Select a table | `onSelect` called with table name |
| `Toolbar` | No tables | All buttons disabled |
| `Toolbar` | Click **Copy SQL** | `onCopySQL` called |
| `Toolbar` | Click **Copy Markdown** | `onCopyMarkdown` called |
| `DefaultEdge` | Selected edge | Relation info label renders |
| `SchemaGraphLegend` | Always renders | All 5 icon labels visible |

---

## Priority 5 — E2E smoke test (optional)

A Playwright test that:

1. Pastes `SAMPLE_SCHEMA` into the textarea.
2. Clicks **Render**.
3. Verifies at least one `.react-flow__node` element appears in the DOM.
4. Verifies the success toast is shown.

---

## Test file structure

```
src/
  lib/
    parseSql.test.ts
    utils.test.ts
    graph.test.ts
  components/
    __tests__/
      Home.test.tsx
      Toolbar.test.tsx
      FindTableSelector.test.tsx
      SchemaGraphLegend.test.tsx
```

## Vitest config (`vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```
