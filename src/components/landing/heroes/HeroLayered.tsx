'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { ArrowRight } from 'lucide-react';

import { CodeWindow } from '@/components/landing/CodeWindow';
import { POSTS_TABLE_SQL } from '@/components/landing/codeSnippets';
import { HeroBadge } from '@/components/landing/HeroBadge';
import { SchemaGraphCanvas } from '@/components/SchemaGraphCanvas';
import { parseSql } from '@/lib/parseSql';
import { SAMPLE_SCHEMA } from '@/lib/sampleSchema';
import { cn } from '@/lib/utils';

export function HeroLayered() {
  const parsed = parseSql(SAMPLE_SCHEMA);

  return (
    <div className="mx-auto max-w-6xl">
      <HeroBadge index={5} total={5} concept="layered · depth" className="mb-6" />

      <div className="max-w-3xl">
        <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl md:leading-[1.05]">
          The SQL is the source. <span className="text-ink-2">The graph is the map.</span>
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-sm text-ink-2 sm:text-base">
          One is what you write. The other is what your database looks like. The visualizer keeps
          them in sync.
        </p>
      </div>

      <div className="relative mt-12">
        <div
          aria-hidden="true"
          className={cn(
            'relative h-[420px] sm:h-[480px] lg:h-[560px]',
            'overflow-hidden rounded-md border border-border-strong bg-surface-1',
            'translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 lg:translate-x-6 lg:translate-y-6'
          )}
        >
          <ReactFlowProvider>
            <SchemaGraphCanvas
              schema={parsed}
              selectedSchemaName=""
              showToolbar={false}
              showLegend={false}
            />
          </ReactFlowProvider>
        </div>

        <div
          className={cn(
            'absolute left-0 top-0 z-sticky w-[78%] sm:w-[70%] lg:w-[64%]',
            'shadow-lg'
          )}
        >
          <CodeWindow filename="schema.sql" code={POSTS_TABLE_SQL} minLines={10} />
        </div>

        <div
          className={cn(
            'absolute z-tooltip flex h-7 items-center gap-1.5 rounded-full border border-accent/40 bg-surface-2 px-3 font-mono text-[10px] uppercase tracking-tight text-ink shadow-md',
            'right-2 bottom-2 sm:right-4 sm:bottom-4'
          )}
        >
          <span className="text-ink-3">render</span>
          <ArrowRight className="h-3 w-3 text-accent" />
        </div>
      </div>
    </div>
  );
}
