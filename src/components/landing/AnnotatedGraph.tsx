'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { Diamond, Fingerprint, Hash, Key } from 'lucide-react';
import type { ReactNode } from 'react';

import { SchemaGraphCanvas } from '@/components/SchemaGraphCanvas';
import { parseSql } from '@/lib/parseSql';
import { SAMPLE_SCHEMA } from '@/lib/sampleSchema';
import { cn } from '@/lib/utils';

type CalloutPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type CalloutTone = 'pk' | 'id' | 'uq' | 'fk' | 'null';

type Callout = {
  id: string;
  label: string;
  hint: string;
  icon: ReactNode;
  position: CalloutPosition;
  tone: CalloutTone;
};

export const ANNOTATED_CALLOUTS: Callout[] = [
  {
    id: 'primary_key',
    label: 'primary_key',
    hint: 'id SERIAL PRIMARY KEY',
    icon: <Key size={12} strokeWidth={1.5} className="text-pk" />,
    position: 'top-left',
    tone: 'pk',
  },
  {
    id: 'foreign_key',
    label: 'foreign_key',
    hint: 'author_id REFERENCES authors(id)',
    icon: <Hash size={12} strokeWidth={1.5} className="text-id" />,
    position: 'top-right',
    tone: 'fk',
  },
  {
    id: 'unique',
    label: 'unique',
    hint: 'slug VARCHAR(255) UNIQUE',
    icon: <Fingerprint size={12} strokeWidth={1.5} className="text-uq" />,
    position: 'bottom-left',
    tone: 'uq',
  },
  {
    id: 'nullable',
    label: 'nullable',
    hint: 'body TEXT',
    icon: <Diamond size={12} strokeWidth={1.5} className="text-null" />,
    position: 'bottom-right',
    tone: 'null',
  },
];

const positionClasses: Record<CalloutPosition, string> = {
  'top-left': 'top-3 left-3 sm:top-4 sm:left-4',
  'top-right': 'top-3 right-3 sm:top-4 sm:right-4',
  'bottom-left': 'bottom-3 left-3 sm:bottom-4 sm:left-4',
  'bottom-right': 'bottom-3 right-3 sm:bottom-4 sm:right-4',
};

const toneBorderClasses: Record<CalloutTone, string> = {
  pk: 'border-pk/40',
  id: 'border-id/40',
  uq: 'border-uq/40',
  fk: 'border-fk/40',
  null: 'border-border-strong',
};

type AnnotatedGraphProps = {
  className?: string;
  height?: string;
  callouts?: Callout[];
  showCaption?: boolean;
};

export function AnnotatedGraph({
  className,
  height = 'h-[520px] sm:h-[600px] lg:h-[720px]',
  callouts = ANNOTATED_CALLOUTS,
  showCaption = false,
}: AnnotatedGraphProps) {
  const parsed = parseSql(SAMPLE_SCHEMA);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-border-strong bg-surface-1',
        className
      )}
    >
      <div className={cn(height, className?.includes('h-[') ? '' : height)}>
        <ReactFlowProvider>
          <SchemaGraphCanvas
            schema={parsed}
            selectedSchemaName=""
            showToolbar={false}
            showLegend={false}
          />
        </ReactFlowProvider>
      </div>

      {callouts.map((callout) => (
        <div
          key={callout.id}
          className={cn(
            'pointer-events-none absolute z-dropdown max-w-[200px] rounded-md border bg-surface-2/95 px-2.5 py-1.5 shadow-md backdrop-blur',
            toneBorderClasses[callout.tone],
            positionClasses[callout.position]
          )}
        >
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink">
            {callout.icon}
            <span>{callout.label}</span>
          </div>
          <p className="mt-0.5 font-mono text-[9.5px] text-ink-3">{callout.hint}</p>
        </div>
      ))}

      {showCaption && (
        <p className="absolute inset-x-0 bottom-0 z-sticky flex justify-center border-t border-border-subtle bg-surface-1/95 px-3 py-2 font-mono text-[10px] text-ink-3 shadow-md backdrop-blur">
          <span className="text-ink-2">{'// '}</span>
          the visualizer is a working surface — every glyph is a contract
        </p>
      )}
    </div>
  );
}
