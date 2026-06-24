'use client';

import { ReactFlowProvider } from '@xyflow/react';

import { HeroBadge } from '@/components/landing/HeroBadge';
import { SchemaGraphCanvas } from '@/components/SchemaGraphCanvas';
import { parseSql } from '@/lib/parseSql';
import { SAMPLE_SCHEMA } from '@/lib/sampleSchema';
import { cn } from '@/lib/utils';

export function HeroOffEdge() {
  const parsed = parseSql(SAMPLE_SCHEMA);

  return (
    <div className="mx-auto max-w-6xl">
      <HeroBadge index={2} total={5} concept="off-edge · editorial" className="mb-8" />

      <h1
        className={cn(
          'text-balance font-display font-semibold tracking-tight text-ink',
          'text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.98]'
        )}
        style={{ letterSpacing: '-0.025em' }}
      >
        A schema is a shape. <br />
        <span className="text-ink-2">Draw it once.</span>
      </h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="max-w-md">
          <p className="text-pretty text-sm text-ink-2 sm:text-base">
            Paste a <span className="text-ink">CREATE TABLE</span> dump, get a navigable map of
            tables, primary keys, and foreign keys. In the browser. No signup. No upload.
          </p>
        </div>

        <div className="relative -mr-6 overflow-hidden sm:-mr-10 lg:-mr-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-sticky w-24 bg-gradient-to-l from-bg to-transparent sm:w-32 lg:w-48"
          />
          <div className="h-[420px] overflow-hidden rounded-md border border-border-strong bg-surface-1 sm:h-[480px] lg:h-[560px]">
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
