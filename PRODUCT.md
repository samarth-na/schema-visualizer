# Product

## Register

product

## Users

Database and backend engineers who have just inherited or joined a project and need to understand a PostgreSQL schema quickly. They are already in their editor, terminal, or a Postgres client; they reach for this tool in the first ten minutes after opening a new database.

The job is orientation, not design. They want to know: which tables exist, how they relate, which columns are primary and foreign keys, which schemas are involved. The faster they can answer those questions, the more useful the tool is.

The "moment" is the first hour of a new codebase, on a laptop, in a quiet room, often with the schema SQL already in their clipboard from a migration dump, a doc, or a teammate's message. They do not want to be sold to, onboarded, or entertained. They want a working surface.

## Product Purpose

A focused tool for turning PostgreSQL DDL into a readable ER diagram in one paste. The user pastes `CREATE TABLE` statements, the parser extracts tables / columns / constraints / foreign-key relationships, and the canvas renders the schema as a navigable graph. They can pan, zoom, find a specific table, and export the result as PNG, SVG, SQL, or Markdown.

It exists because the alternative — reading hundreds of lines of DDL or waiting for a teammate to draw a diagram — is slow and lossy. Success looks like: the user pastes, finds the relationship they were looking for in under thirty seconds, and closes the tab with the right mental model of the schema.

Privacy is structural, not a feature: everything happens client-side, so the user can paste production dumps without worrying.

## Brand Personality

**Calm, confident, precise.**

The tool is quiet in the hand. It does not announce itself. Defaults are correct on the first try. Errors are useful, not alarming. Empty states teach the interface, they do not beg for input. The product reads as a working instrument — closer to a code editor's chrome than to a SaaS dashboard.

Voice is the same as a senior engineer's: dry, accurate, free of hype. No "amazing", no "powerful", no "supercharge". Labels are domain vocabulary, not marketing vocabulary ("primary key", "foreign key", "schema", "column", "constraint") — these words are not explained because the audience knows them.

Visual character is dense, dark by default, keyboard-first, with iconography that is monoline, consistent, and quiet (in the manner of Phosphor's icon family). The tool disappears into the task; the user thinks about the schema, not the interface.

Three-word personality: **calm, precise, honest**.

## Anti-references

The tool must not look or behave like any of the following:

- **Generic SaaS landing and dashboard aesthetic.** Saturated `blue-600` hero, identical six-card icon grid (`bg-blue-50 p-3` rounded square + heading + paragraph), a `rounded-3xl` blue CTA box, and a sticky header. This is the 2024-2026 default and it makes the product look interchangeable with every other dev tool. The current `/` page has most of these tells and will be redesigned.
- **`dbdiagram.io` and its 2018-era cousins.** The same beige-and-blue palette, the same primary CTA box, the same "sample schema" hero with a static screenshot. The category has been stuck in this look for years; we are not the version that stays there.
- **JetBrains / DataGrip / heavy IDE chrome.** Top menubar, side tool window, status bar, palette-and-panel-everywhere. This is not an IDE; it is a focused single-purpose tool. The chrome should be quiet.
- **Editorial-magazine aesthetics.** Display italic serif headlines, ruled columns, drop caps, broadsheet grid. Magazine aesthetics on a developer tool read as costume, not as refinement. We are not building a magazine.
- **Decorative motion.** Bounce, elastic, spring, parallax, scroll-driven reveals. The product is in-flow; motion conveys state (selection, transition, validation) and nothing else.
- **Hand-drawn / sketchy / wavy decoration.** Anything that signals "playful", "casual", or "fun" undermines the serious-engineer trust posture. The product is not whimsical.

## Design Principles

1. **Tool over showcase.** Every surface should behave like a working instrument. The product earns trust by being useful on the first paste, not by performing. No empty states that beg; every empty state teaches the next step.

2. **Earned familiarity.** Use the vocabulary engineers already use (primary key, foreign key, schema, constraint, identity, cascade). Do not rename them. Do not explain them. The user knows what a `BIGSERIAL` is.

3. **Keyboard parity.** Every action reachable from the keyboard with a visible or discoverable shortcut. The mouse is a convenience, not a requirement. The find-table selector, schema switcher, render button, and export controls all have keyboard paths. Power users go first; mouse users benefit as a side effect.

4. **Dark by default, with light as a courtesy.** The working surface is dark. Light mode exists and meets the same contrast and information-density bar, but the design effort is weighted toward dark. Engineers work at night; the tool should be the easy part of the screen.

5. **Honest motion.** Motion conveys state — selection, transition, validation, error recovery. No decorative motion. Every transition has a `prefers-reduced-motion: reduce` alternative. Layout transitions are reserved for real state changes (theme switch, schema swap), not for ornament.

6. **Clarity at density.** Information density is the point, not the enemy. Tables render all their columns. The toolbar exposes its actions. The legend is one line. No decorative whitespace; spacing earns its place. Density that improves legibility is good; density that hides affordances is bad.

7. **Privacy as structure, not marketing.** The product does not need to advertise that it is client-side; that is a property of the architecture, not a pitch. The user will discover it. What matters is that pasting real schemas feels safe, so error states must be transparent, exports must work, and the parser must be correct.

## Accessibility & Inclusion

Target: **WCAG 2.2 AA** across the entire surface, with reduced-motion alternatives on every transition.

Specific commitments:

- **Contrast.** All body text ≥ 4.5:1 against its background. Large text (≥ 18px or bold ≥ 14px) ≥ 3:1. Placeholder text and form labels meet the same bar — not the muted-gray default that often fails in dark mode.
- **Focus rings.** Every interactive element has a visible, high-contrast focus ring. The focus ring is part of the design system, not an afterthought. Keyboard focus order is logical top-to-bottom, left-to-right.
- **Keyboard control.** All actions — paste, render, find table, switch schema, copy, export, reset layout, navigate the canvas — are reachable from the keyboard. The canvas exposes arrow-key panning and `+/-` zoom where React Flow supports it; other actions have shortcuts.
- **Reduced motion.** Every transition has a `prefers-reduced-motion: reduce` variant. Default animations are short (150–250ms), eased-out, and convey state. Long entrance choreography is banned.
- **Canvas and graph a11y.** The graph itself is a complex visual structure. For the foreseeable scope we provide: an accessible list of tables and their columns (rendered as a parallel `<details>`-based view or a screen-reader-only companion structure) and ARIA labels on the canvas, the toolbar, and every interactive control.
- **Color independence.** Information in the schema graph (primary key, foreign key, nullable, unique, identity) is signaled by both color and icon — never by color alone. Edge selection, table selection, schema filter, and error states are all non-color-differentiated.
- **Reduced data fidelity.** The product does not assume the user can perceive small text. Default type sizes meet AA. The data-density bar is not a barrier to legibility.

Known future work beyond this init: a screen-reader-narrable graph traversal (announce "Table `posts` references `authors` on column `author_id`"), and a high-contrast theme tuned for very low vision.
