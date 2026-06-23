# Design

## Theme

**Visual mood:** quiet engineer's desk at night — phosphor amber glow on a calm dark surface, the type-specimen honesty of a working tool. Warmth lives in the brand colors and typography; the surface is neutral and quiet. The tool is dense, keyboard-first, and never decorative. Phosphor-style iconography: monoline, geometric, consistent, never whimsical.

**Aesthetic anchor:** the seam between Linear (calm, dense, dark, confident) and a 1970s HP calculator (warm phosphor glow, honest instrument). The product reads as a working tool, not a showcase.

**Color strategy:** Restrained. One primary (seed olive) carries the primary-action color; one accent (phosphor amber) carries current selection, focus, and active state. Most of the interface is neutral surface plus ink. Data signals (primary key, foreign key, unique, identity, nullable) are signaled by both icon and color, never by color alone.

**Reference products:** Linear (calm, dense, dark default, exceptional focus-ring and toolbar craft), Phosphor Icons (monoline, geometric, warm iconography), Vercel dashboard (pure near-black, no hue tint on the surface), Raycast (keyboard-first, motion-as-feedback, tight typography). Anti-references are listed in `PRODUCT.md` § Anti-references.

**Identity preservation:** Geist Sans + Geist Mono are committed in `src/app/layout.tsx` and stay. The current `blue-600` is not preserved (it is the SaaS-default and is not part of the brand system being built); it is replaced by the primary olive and accent amber below.

## Color Palette

All colors are OKLCH. Light mode and dark mode are first-class; dark is the default and the design effort is weighted toward it. The surface in both modes is **neutral** (chroma 0) on purpose: the warmth lives in primary and accent, not in the body background. This is the difference between a tool that uses warmth and a tool that *is* warm.

### Roles (dark mode, default)

| Role | Token | OKLCH | Use |
|---|---|---|---|
| bg | `--bg` | `oklch(0.12 0.000 0)` | App canvas, body background. Pure near-black, no hue tint. |
| surface 1 | `--surface-1` | `oklch(0.16 0.000 0)` | Card / panel base, lifted from bg. |
| surface 2 | `--surface-2` | `oklch(0.20 0.000 0)` | Toolbar, dropdown, popover, hover on surface-1. |
| surface 3 | `--surface-3` | `oklch(0.24 0.000 0)` | Selected row, pressed control. |
| border subtle | `--border-subtle` | `oklch(0.24 0.000 0)` | Hairline dividers inside dense UI. |
| border strong | `--border-strong` | `oklch(0.32 0.000 0)` | Component outlines, input borders. |
| ink primary | `--ink` | `oklch(0.96 0.000 0)` | Body, headings, primary text. ≥15:1 on bg. |
| ink secondary | `--ink-2` | `oklch(0.78 0.000 0)` | Labels, table headers. ≥9.5:1 on bg. |
| ink muted | `--ink-3` | `oklch(0.66 0.000 0)` | Metadata, placeholders. ≥4.7:1 on bg. |
| primary | `--primary` | `oklch(0.78 0.090 110)` | Primary action (Render Graph), strong confirmation. |
| primary hover | `--primary-hover` | `oklch(0.84 0.090 110)` | Hovered primary button. |
| primary pressed | `--primary-pressed` | `oklch(0.72 0.090 110)` | Pressed primary button. |
| primary text | `--on-primary` | `oklch(1.00 0.000 0)` | Text on `--primary` fills. |
| accent | `--accent` | `oklch(0.78 0.130 75)` | Selection, focus ring, current state. |
| accent subtle | `--accent-subtle` | `oklch(0.30 0.060 75)` | Selected row tint, hover on data rows. |
| accent text | `--on-accent` | `oklch(0.18 0.000 0)` | Text on accent fills when needed (only on pale accent badges). |
| focus ring | `--focus` | `oklch(0.78 0.130 75)` | Visible focus ring at 2px, with 2px offset. |
| success | `--success` | `oklch(0.74 0.130 150)` | Toast success, parse OK, schema rendered. |
| warning | `--warning` | `oklch(0.78 0.140 80)` | Toast warning, partial parse. |
| error | `--error` | `oklch(0.68 0.180 25)` | Parse error, copy failure. |
| info | `--info` | `oklch(0.74 0.080 230)` | Non-brand info, secondary hints. |

### Roles (light mode)

| Role | Token | OKLCH | Use |
|---|---|---|---|
| bg | `--bg` | `oklch(1.00 0.000 0)` | App canvas, body background. Pure white. |
| surface 1 | `--surface-1` | `oklch(0.985 0.000 0)` | Card / panel base. |
| surface 2 | `--surface-2` | `oklch(0.965 0.000 0)` | Toolbar, dropdown. |
| surface 3 | `--surface-3` | `oklch(0.94 0.000 0)` | Selected row. |
| border subtle | `--border-subtle` | `oklch(0.92 0.000 0)` | Hairline dividers. |
| border strong | `--border-strong` | `oklch(0.82 0.000 0)` | Component outlines. |
| ink primary | `--ink` | `oklch(0.18 0.000 0)` | Body, headings. ≥15:1 on bg. |
| ink secondary | `--ink-2` | `oklch(0.36 0.000 0)` | Labels. ≥9:1. |
| ink muted | `--ink-3` | `oklch(0.46 0.000 0)` | Metadata. ≥4.5:1. |
| primary | `--primary` | `oklch(0.50 0.090 110)` | Primary action. Deeper for legibility on white. |
| primary hover | `--primary-hover` | `oklch(0.44 0.090 110)` | Hovered. |
| primary pressed | `--primary-pressed` | `oklch(0.40 0.090 110)` | Pressed. |
| primary text | `--on-primary` | `oklch(1.00 0.000 0)` | Text on primary fills. |
| accent | `--accent` | `oklch(0.55 0.140 65)` | Selection, focus. Deeper amber for legibility. |
| accent subtle | `--accent-subtle` | `oklch(0.94 0.060 75)` | Selected row tint. |
| accent text | `--on-accent` | `oklch(1.00 0.000 0)` | Text on accent fills. |
| focus ring | `--focus` | `oklch(0.55 0.140 65)` | Visible focus ring at 2px, 2px offset. |
| success | `--success` | `oklch(0.50 0.130 150)` | Deeper green for white bg. |
| warning | `--warning` | `oklch(0.55 0.140 70)` | Deeper amber. |
| error | `--error` | `oklch(0.50 0.180 25)` | Deeper red. |
| info | `--info` | `oklch(0.50 0.080 230)` | Deeper blue. |

### Data signal palette

The schema graph signals are **independent of brand color** so the brand does not fight the data. Each signal is shown as both an icon and a color; the icon is the primary differentiator.

| Signal | Token | OKLCH | Icon | Pattern |
|---|---|---|---|---|
| Primary key | `--pk` | `oklch(0.78 0.130 75)` | `Key` | Solid dot or bar marker in legend. |
| Identity | `--id` | `oklch(0.74 0.060 280)` | `Hash` | Distinct from primary key. |
| Unique | `--uq` | `oklch(0.74 0.130 150)` | `Fingerprint` | — |
| Nullable | `--null` | `oklch(0.74 0.000 0)` | `Diamond` outline | Hollow diamond, no fill. |
| Non-nullable | `--not-null` | `oklch(0.74 0.000 0)` | `Diamond` filled | Solid diamond, neutral fill. |
| Foreign key edge | `--fk` | `oklch(0.78 0.130 75)` | smooth-step | Same hue as primary key; distinguishable by edge pattern (dashed when no concrete target, solid when bound). |

In light mode the data signal colors deepen by ~0.18 L for the same legibility on white.

### Mapping to current code

The codebase currently uses raw Tailwind `zinc-*`, `blue-600`, and `red-500/200/700` utilities. The mapping when implementing the new system is:

| Current class | New token |
|---|---|
| `bg-white dark:bg-zinc-950` | `bg-bg` |
| `bg-zinc-50 dark:bg-zinc-900` | `bg-surface-1` |
| `bg-zinc-100 dark:bg-zinc-800` | `bg-surface-2` |
| `bg-zinc-200 dark:bg-zinc-700` | `bg-surface-3` |
| `border-zinc-200 dark:border-zinc-800` | `border-border-subtle` |
| `border-zinc-300 dark:border-zinc-700` | `border-border-strong` |
| `text-zinc-900 dark:text-zinc-100` | `text-ink` |
| `text-zinc-600 dark:text-zinc-400` | `text-ink-2` |
| `text-zinc-500 dark:text-zinc-500` | `text-ink-3` |
| `bg-blue-600`, `text-blue-600`, `ring-blue-500` | `bg-primary` / `text-primary` / `ring-accent` |
| `bg-red-50 dark:bg-red-950`, `text-red-700` | `bg-error/10` / `text-error` |
| `bg-blue-50 dark:bg-blue-950` (selection) | `bg-accent-subtle` |

## Typography

**Family pair (committed, identity-preserved):** Geist Sans (UI) + Geist Mono (code, data, column types). Loaded via `next/font/google` in `src/app/layout.tsx` and exposed as `--font-geist-sans` / `--font-geist-mono`. Do not substitute.

### Scale (rem-based, fixed for product UI)

| Step | Size | Use | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| display | 2.5rem (40px) | Marketing hero h1 only | 600 | 1.1 | -0.02em |
| h1 | 1.75rem (28px) | Page titles (e.g. app header) | 600 | 1.2 | -0.02em |
| h2 | 1.375rem (22px) | Section headings | 600 | 1.25 | -0.01em |
| h3 | 1.125rem (18px) | Card / sub-section | 600 | 1.3 | 0 |
| body-lg | 1rem (16px) | Marketing body, large UI | 400 | 1.55 | 0 |
| body | 0.875rem (14px) | UI body | 400 | 1.5 | 0 |
| small | 0.8125rem (13px) | Toolbar buttons, labels | 500 | 1.4 | 0 |
| micro | 0.75rem (12px) | Tooltips, micro-copy, table cells | 500 | 1.35 | 0 |
| micro-mono | 0.6875rem (11px) | Column types, table metadata | 500 (mono) | 1.3 | 0 |
| code | 0.8125rem (13px) | SQL textarea | 400 (mono) | 1.55 | 0 |

**Hard rules:**

- Display letter-spacing is `-0.02em` minimum. The current `tracking-tight` is `-0.025em` and passes the `-0.04em` floor; do not tighten further on display.
- `text-wrap: balance` is applied to `h1`, `h2`, `h3`. `text-wrap: pretty` is applied to body paragraphs in marketing copy.
- Headings are `text-balance`; never `text-justify`.
- Monospace is reserved for code, data types, SQL, and key labels. **Monospace is not used as a "developer aesthetic" decoration** (per `PRODUCT.md` § Anti-references).

### Weight usage

- 600 (semibold) for headings, primary buttons, table headers.
- 500 (medium) for buttons, labels, table cells.
- 400 (regular) for body, input text.
- **No weights above 600 in UI.** No black, no extrabold, no display weights. The product is dense; loud weights break the calm.

## Spacing

A 4px-base modular scale. Spacing tokens are the only units of space; raw `px` values are banned in component code (except where a sub-pixel requirement is unavoidable, e.g. 1px hairlines).

| Token | Value | Use |
|---|---|---|
| `0` | 0 | — |
| `0.5` | 2px | Sub-pixel nudge; rarely used. |
| `1` | 4px | Tight grouping: icon-to-label. |
| `1.5` | 6px | Inline icon padding. |
| `2` | 8px | Between related controls. |
| `3` | 12px | Inside controls, padding. |
| `4` | 16px | Card padding, section gap. |
| `5` | 20px | — |
| `6` | 24px | Section gap, larger padding. |
| `8` | 32px | Major section break. |
| `10` | 40px | Page-level padding. |
| `12` | 48px | Hero top, section padding. |
| `16` | 64px | Hero bottom. |
| `20` | 80px | Marketing section break. |
| `24` | 96px | Marketing max-section. |

The marketing landing page has its own expanded spacing scale for hero / section rhythm: 96 / 128 / 160 / 192 px above the standard. This is scoped to `src/app/page.tsx` and the surrounding marketing components.

## Components

The product has a small, opinionated component vocabulary. Same shape, same affordances, every place. **Inconsistent component vocabulary is a ban** (per `PRODUCT.md` § Anti-references).

### Button

Three intents × two sizes × two states (default / disabled). Loading is a state, not a size.

| Intent | bg | text | border | Use |
|---|---|---|---|---|
| primary | `--primary` | `--on-primary` | none | "Render Graph" (one per page). |
| secondary | `--surface-2` | `--ink` | `--border-strong` | "Copy SQL", "Copy Markdown", toolbar actions. |
| ghost | transparent | `--ink-2` | none | "Load example", "Clear" in panel headers. |

Sizes: `sm` (h-7 px-3 text-small), `md` (h-9 px-4 text-body), `lg` (h-11 px-6 text-body-lg). All buttons have `rounded-md` (6px). No buttons above `rounded-lg` (8px). No pill buttons. No icons-inside-rounded-squares above button labels.

**Bans:** `border + box-shadow` on the same button. The current `shadow-lg shadow-blue-600/20` CTA is the ghost-card pattern and is banned. The primary button is solid color, no shadow.

### Input

`h-9`, `px-3`, `rounded-md`, `bg-surface-1`, `border-border-strong`, `text-body`, `placeholder:text-ink-3`. Focus: `ring-2 ring-accent ring-offset-2 ring-offset-bg`. Disabled: `opacity-50`, `cursor-not-allowed`.

### Select

Native `<select>` styled to match input. No custom dropdown UI for schema switching — keep the affordance standard.

### Toolbar

A horizontal bar, `bg-surface-1`, `border-b border-border-subtle`, `h-11`, `px-4`. Inside: `flex items-center gap-2`. Each action is a secondary button or an icon button.

### Table node (graph)

`bg-surface-1`, `border border-border-strong`, `rounded-md` (6px), `shadow-sm` (subtle: `0 1px 2px oklch(0 0 0 / 0.3)`). Header bar: `bg-surface-2 h-[22px]`. Column rows: `h-[22px]`, `border-t border-border-subtle`. No `shadow-lg`. No `rounded-2xl`. Width: `TABLE_NODE_WIDTH / 2` (committed constant).

### Edge (graph)

Smooth-step path, `stroke = --fk`, `strokeWidth = 1.5`, `borderRadius = 8`. Selected: `stroke = --accent`, `strokeWidth = 2.5`. Animated: dashed flow when bound to a selected table.

### Toast (sonner)

`bg-surface-2`, `border border-border-strong`, `text-ink`, `rounded-md`. Success uses `--success` left border. Error uses `--error` left border. **No side-stripe borders ≥ 1px as a colored accent** (per `AGENTS.md` design rules). Toasts are positioned `top-center`, `richColors` disabled (we provide our own theming).

### Empty state

Centered, `max-w-sm`, `text-ink-2`. Single icon (24px, `text-ink-3`). One-sentence description of the next action. **No big rounded-2xl hero card with "Get started" CTA** — empty state is a sentence, not a card.

### Modal / dialog

Native `<dialog>` element with `position: fixed`. No `position: absolute` inside `overflow: hidden` containers (per `AGENTS.md` known hazard).

## Layout

### Product layout (`/app`)

- **Header:** `h-12`, `border-b border-border-subtle`, `bg-surface-1`. Sticky, no backdrop-blur.
- **Two-pane shell:** left SQL input panel (`w-105` = 420px, `bg-surface-1`, `border-r`) + right graph canvas (`flex-1`).
- **Mobile fallback:** at `<lg` (1024px), the two-pane collapses to a tab switcher. SQL input is full-width with a "View graph" tab action. Implemented with the native `<dialog>` for the canvas panel on small screens.
- **Graph canvas:** `bg-bg` (deepest), `flex-1`. Toolbar inside, `h-11`. Legend pinned to bottom, `h-10`.

### Marketing layout (`/`)

Same visual language as the product, no shared component library yet (the product is the priority). The marketing surface inherits: font, color tokens, focus rings, button shapes. It does **not** inherit the SaaS-cream hero or the 6-card grid.

### Grid

- Responsive product grids use `repeat(auto-fit, minmax(280px, 1fr))` for breakpoint-free behavior.
- The marketing landing uses a 12-column grid at `≥md`; full-width sections otherwise.

### Container

- Product: `max-w-7xl mx-auto px-4 lg:px-6`.
- Marketing: `max-w-6xl mx-auto px-6` for body sections, `max-w-4xl` for hero copy.

## Motion

**Honest motion.** Motion conveys state, never decoration. Default duration is 150–250ms. Default easing is `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quint, no bounce, no elastic). Layout transitions are reserved for real state changes (theme switch, schema swap).

### Scale

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion-instant` | 0ms | — | Reduced motion override. |
| `motion-fast` | 100ms | `--ease-out` | Color/background hover transitions. |
| `motion-base` | 200ms | `--ease-out` | Button states, row hover, focus ring. |
| `motion-slow` | 300ms | `--ease-out` | Layout changes (panel swap, theme switch). |
| `motion-pane` | 400ms | `--ease-out` | Schema swap, graph re-render. |

### Reduced motion

`@media (prefers-reduced-motion: reduce)` collapses all `motion-base/slow/pane` to `motion-instant` (0ms). Hover and focus state changes still update colors instantly (a state change, not motion). No content is gated on motion-triggered classes; the page is fully visible without animation.

### Specific patterns

- **Theme switch:** `<html>` class toggle with `motion-slow` crossfade on `background-color` and `color`. Reduced motion: instant.
- **Graph re-render:** `motion-pane` on `opacity` and a small `translateY(4px)`. Reduced motion: opacity only.
- **Toolbar hover:** `motion-fast` on `background-color` only.
- **Toast enter/leave:** `motion-base` slide + fade. Reduced motion: fade only.
- **Find-table selector open:** `motion-fast` on `opacity` + `scale(0.98 → 1)`. Reduced motion: fade only.

## Iconography

**Set:** `lucide-react` (current dependency). Phosphor-style character is the reference; lucide delivers the same monoline, geometric, consistent feel at the size we use. No migration to Phosphor is planned in this init.

**Stroke weight:** 1.5 for all icons 16px and larger. 1.25 for 12–14px. Lucide's default is 2; we override with `strokeWidth={1.5}` (or `1.25` for dense nodes) on every icon call site. The current `TableNode` uses `strokeWidth={1}` and `size={8–12}`; this is consistent with the rule and stays.

**Sizes:**

| Size | Use |
|---|---|
| 12 | Toolbar, dense nodes, micro-copy inline. |
| 14 | Buttons (sm), table cells, secondary controls. |
| 16 | Buttons (md), tooltips, list items. |
| 18 | Section icons. |
| 20 | Card icons. |
| 24 | Empty-state icon, page header. |
| 32 | Marketing hero accent only. |

**Color:** icons inherit `currentColor` from the parent. No icon uses a `text-*` class directly unless the surrounding context is a colored surface (e.g. a status pill).

## Borders & Elevation

**Borders:** `1px` only. `2px` only for focus rings. No thicker decorative borders.

| Token | Value | Use |
|---|---|---|
| `border-hairline` | 1px solid `--border-subtle` | Inside dense UI, table rows. |
| `border-control` | 1px solid `--border-strong` | Input, button, card. |
| `border-focus` | 2px solid `--focus`, 2px offset `--bg` | Focus ring (universal). |

**Elevation (shadows):**

| Token | Value | Use |
|---|---|---|
| `shadow-none` | none | Default for components. |
| `shadow-sm` | `0 1px 2px oklch(0 0 0 / 0.30)` | Hover on button, table node. |
| `shadow-md` | `0 4px 8px oklch(0 0 0 / 0.30)` | Popover, dropdown, toolbar sticky. |
| `shadow-lg` | `0 8px 16px oklch(0 0 0 / 0.35)` | Modal, exported image. |

**Ban:** `border + box-shadow` on the same element as decoration. The current `shadow-lg shadow-blue-600/20` CTA button has a 1px `border` *and* an 8px+ blur shadow; that is the ghost-card pattern and is banned. The primary button is a solid fill, no shadow. Cards may have a 1px border OR a shadow, not both.

## Z-Index

| Token | Value | Use |
|---|---|---|
| `z-base` | 0 | Default. |
| `z-sticky` | 10 | Sticky header, toolbar. |
| `z-dropdown` | 20 | Find-table selector, schema filter, popovers. |
| `z-toast` | 50 | Sonner toasts. |
| `z-modal` | 60 | Native dialog. |
| `z-tooltip` | 70 | Tooltips. |

No `9999`. No arbitrary values. The `z-50` on the marketing sticky header becomes `z-sticky` (= 10) — 50 is an arbitrary residue from create-next-app and is replaced.

## Accessibility

- WCAG 2.2 AA across the surface. Body text ≥ 4.5:1; large text ≥ 3:1; placeholder text ≥ 4.5:1.
- Focus rings are part of the design system, not an afterthought: 2px `--focus` with 2px `--bg` offset, on every interactive element.
- Keyboard control is total: paste, render, find table, switch schema, copy, export, reset layout, navigate the canvas.
- Reduced motion alternatives on every transition.
- Color is never the only signal: data signals have icons; toasts have icons and text; selected state has both color and weight.
- The graph is a complex visual structure. A parallel screen-reader-only `<details>`-based view of tables and their columns is required. Edge relationships are exposed as a `<ul>` for screen readers.
