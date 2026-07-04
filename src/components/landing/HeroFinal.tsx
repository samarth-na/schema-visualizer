'use client';

import { ArrowDown, Terminal } from 'lucide-react';

import { AnnotatedGraph } from '@/components/landing/AnnotatedGraph';
import { CodeWindow } from '@/components/landing/CodeWindow';
import { POSTS_TABLE_SQL } from '@/components/landing/codeSnippets';

export function HeroFinal() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="max-w-3xl">
        <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl md:leading-[1.05]">
          Turn SQL DDL into an interactive ER diagram.
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-sm text-ink-2 sm:text-base">
          Paste{' '}
          <code className="rounded border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
            CREATE TABLE
          </code>{' '}
          statements from PostgreSQL, MySQL, or SQLite. Get a navigable map of tables, columns,
          primary keys, and foreign keys — in your browser, no signup.
        </p>
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] text-ink-3">
          <Terminal size={12} strokeWidth={1.5} aria-hidden="true" />
          <span>your schema</span>
          <span className="text-ink-3/60">·</span>
          <span className="text-ink-2">app.posts</span>
        </div>
        <CodeWindow filename="schema.sql" code={POSTS_TABLE_SQL} />

        <div aria-hidden="true" className="my-6 flex flex-col items-center gap-1 text-ink-3">
          <div className="h-6 w-px bg-border-strong" />
          <div className="flex h-7 items-center gap-2 rounded-full border border-border-strong bg-surface-2 px-3 font-mono text-[10px] uppercase tracking-tight text-ink-2">
            <span>render</span>
            <ArrowDown className="h-3 w-3 text-accent" />
          </div>
          <div className="h-6 w-px bg-border-strong" />
        </div>

        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] text-ink-3">
          <span>the sample</span>
          <span className="text-ink-3/60">·</span>
          <span className="text-ink-2">6 tables · 5 foreign keys</span>
        </div>
        <AnnotatedGraph />
      </div>
    </div>
  );
}
