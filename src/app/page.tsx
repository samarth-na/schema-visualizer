import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { SampleSchemaVisualizer } from '@/components/SampleSchemaVisualizer';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="z-sticky sticky top-0 flex h-12 items-center justify-between border-b border-border-subtle bg-bg/80 px-6 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">SQL Schema Visualizer</span>
        </Link>
        <nav className="flex items-center gap-1">
          <a
            href="#capabilities"
            className="hidden rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-fast ease-out hover:bg-surface-2 hover:text-ink sm:inline-flex"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            className="hidden rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-fast ease-out hover:bg-surface-2 hover:text-ink sm:inline-flex"
          >
            How it works
          </a>
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex-1">
        <section className="px-6 pt-12 pb-12 sm:pt-16 sm:pb-14">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl md:leading-[1.05]">
                Turn PostgreSQL DDL into an interactive ER diagram.
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-sm text-ink-2 sm:text-base">
                Paste{' '}
                <code className="rounded border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
                  CREATE TABLE
                </code>{' '}
                statements. Get a navigable map of tables, columns, primary keys, and foreign keys —
                in your browser, no signup.
              </p>
              <div className="mt-7">
                <Link
                  href="/app"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-button-border bg-button-bg px-5 text-sm font-medium text-ink shadow-card transition-all duration-fast ease-out hover:-translate-y-0.5 hover:bg-surface-2"
                >
                  Visualize your schema
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-10 sm:mt-12">
              <SampleSchemaVisualizer hero />
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="border-t border-border-subtle bg-surface-1 px-6 py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-2xl">
              <p className="font-mono text-[11px] text-ink-3">capabilities</p>
              <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Everything you need to explore a schema.
              </h2>
              <p className="mt-3 text-pretty text-sm text-ink-2 sm:text-base">
                Built for engineers who want to understand a database layout in seconds, not hours.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-md border border-border-strong bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
              <Capability
                title="Interactive canvas"
                description="Pan, zoom, and drag nodes. Hover to trace foreign keys across tables and schemas."
              />
              <Capability
                title="Auto layout"
                description="Tables arrange themselves to minimize edge crossings. Reset any time."
              />
              <Capability
                title="Multi-schema support"
                description="Switch between schemas to focus on one area, or view cross-schema foreign keys at a glance."
              />
              <Capability
                title="Export to PNG and SVG"
                description="Download a high-resolution image of your diagram for docs, slides, or pull requests."
              />
              <Capability
                title="Privacy first"
                description="All parsing and rendering happens in your browser. Your SQL never leaves the client."
              />
              <Capability
                title="Copy as SQL or Markdown"
                description="Round-trip a schema between your editor, a doc, and the visualizer without losing structure."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                How it works.
              </h2>
              <p className="mt-3 text-pretty text-sm text-ink-2 sm:text-base">
                From raw SQL to a clean ER diagram in three steps.
              </p>
            </div>
            <ol className="grid gap-6 md:grid-cols-3">
              <li>
                <span className="font-mono text-[11px] text-ink-3">01</span>
                <h3 className="mt-2 text-lg font-semibold text-ink">Paste your SQL</h3>
                <p className="mt-2 text-sm text-ink-2">
                  Drop in <code className="font-mono text-[0.85em] text-ink">CREATE TABLE</code>{' '}
                  statements with primary key, foreign key, and unique constraints.
                </p>
              </li>
              <li>
                <span className="font-mono text-[11px] text-ink-3">02</span>
                <h3 className="mt-2 text-lg font-semibold text-ink">Render the graph</h3>
                <p className="mt-2 text-sm text-ink-2">
                  The parser builds a table-and-column model and computes an automatic layout.
                </p>
              </li>
              <li>
                <span className="font-mono text-[11px] text-ink-3">03</span>
                <h3 className="mt-2 text-lg font-semibold text-ink">Explore and export</h3>
                <p className="mt-2 text-sm text-ink-2">
                  Pan and zoom the canvas, filter by schema, and download a PNG or SVG when you are
                  ready.
                </p>
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-ink-3">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">SQL Schema Visualizer</span>
          </div>
          <p className="text-xs text-ink-3">Open source. Client-side. No tracking.</p>
        </div>
      </footer>
    </div>
  );
}

function Capability({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 bg-surface-1 p-5">
      <div className="h-1 w-6 rounded-full bg-accent" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="text-sm text-ink-2">{description}</p>
    </div>
  );
}
