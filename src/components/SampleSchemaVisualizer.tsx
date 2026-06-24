'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { SchemaGraphCanvas } from '@/components/SchemaGraphCanvas';
import { formatParseError, parseSql } from '@/lib/parseSql';
import { SAMPLE_SCHEMA } from '@/lib/sampleSchema';
import type { ParsedSchema } from '@/lib/types';
import { cn } from '@/lib/utils';

type SampleSchemaResult = { ok: true; schema: ParsedSchema } | { ok: false; error: string };

type SampleSchemaVisualizerProps = {
  compact?: boolean;
  hero?: boolean;
};

export function SampleSchemaVisualizer({
  compact = false,
  hero = false,
}: SampleSchemaVisualizerProps) {
  const result = useMemo<SampleSchemaResult>(() => {
    try {
      return { ok: true, schema: parseSql(SAMPLE_SCHEMA) };
    } catch (err) {
      return { ok: false, error: formatParseError(err) };
    }
  }, []);

  if (!result.ok) {
    return (
      <div className="rounded-md border border-error/40 bg-error/10 px-6 py-12 text-center">
        <TriangleAlert className="mx-auto mb-3 h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm font-medium text-error">Failed to load the sample schema preview.</p>
        {result.error && <p className="mt-1 text-xs text-error/80">{result.error}</p>}
      </div>
    );
  }

  if (hero) {
    return (
      <div className="overflow-hidden rounded-lg bg-surface-1">
        <div className="flex h-7 items-center justify-between border-b border-border-subtle bg-surface-1 px-3">
          <span className="font-mono text-[10px] text-ink-3">sample.app</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-3">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            live
          </span>
        </div>
        <div className="h-[504px] sm:h-[600px] lg:h-[720px]">
          <ReactFlowProvider>
            <SchemaGraphCanvas schema={result.schema} selectedSchemaName="" showToolbar={false} />
          </ReactFlowProvider>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-border-strong bg-surface-1 shadow-md',
        compact && 'shadow-sm'
      )}
    >
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface-1 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Sample schema</p>
            <p className="text-xs text-ink-3">Pan, zoom, drag tables, and use the toolbar.</p>
          </div>
          <Link
            href="/app"
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-on-primary transition-colors duration-fast ease-out hover:bg-primary-hover"
          >
            Try your own SQL
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      <div
        className={cn(
          'w-full',
          compact ? 'h-[360px] sm:h-[420px] lg:h-[460px]' : 'h-[520px] sm:h-[600px] lg:h-[680px]'
        )}
      >
        <ReactFlowProvider>
          <SchemaGraphCanvas schema={result.schema} selectedSchemaName="" />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
