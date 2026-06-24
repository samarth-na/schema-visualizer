'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { ArrowRight, Terminal } from 'lucide-react';

import { CodeWindow } from '@/components/landing/CodeWindow';
import { POSTS_TABLE_SQL } from '@/components/landing/codeSnippets';
import { HeroBadge } from '@/components/landing/HeroBadge';
import { SchemaGraphCanvas } from '@/components/SchemaGraphCanvas';
import { parseSql } from '@/lib/parseSql';
import { SAMPLE_SCHEMA } from '@/lib/sampleSchema';

export function HeroInputOutput() {
  const parsed = parseSql(SAMPLE_SCHEMA);

  return (
    <div className="mx-auto max-w-6xl">
      <HeroBadge index={1} total={5} concept="input → output" className="mb-6" />

      <div className="max-w-3xl">
        <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl md:leading-[1.05]">
          Paste your SQL. See the shape of your schema.
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-sm text-ink-2 sm:text-base">
          One pane for{' '}
          <code className="rounded border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
            CREATE TABLE
          </code>
          , one pane for the graph. The transformation is the product.
        </p>
      </div>

      <div className="mt-10 grid items-stretch gap-3 sm:gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-h-[320px] flex-col">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-ink-3">
            <Terminal size={12} strokeWidth={1.5} aria-hidden="true" />
            <span>sql input</span>
            <span className="text-ink-3/60">·</span>
            <span className="text-ink-2">app.posts</span>
          </div>
          <div className="flex-1">
            <CodeWindow filename="schema.sql" code={POSTS_TABLE_SQL} />
          </div>
        </div>

        <div className="flex items-center justify-center md:flex-col md:justify-center md:px-1">
          <div
            className="flex h-7 items-center gap-2 rounded-full border border-border-strong bg-surface-2 px-3 font-mono text-[10px] uppercase tracking-tight text-ink-2"
            aria-hidden="true"
          >
            <span>render</span>
            <ArrowRight className="h-3 w-3 text-accent" />
          </div>
        </div>

        <div className="flex min-h-[320px] flex-col">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-ink-3">
            <span>graph</span>
            <span className="text-ink-3/60">·</span>
            <span className="text-ink-2">6 tables · 5 foreign keys</span>
          </div>
          <div className="flex-1 overflow-hidden rounded-md border border-border-strong bg-surface-1">
            <ReactFlowProvider>
              <SchemaGraphCanvas
                schema={parsed}
                selectedSchemaName=""
                showToolbar={false}
                showLegend={false}
              />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
