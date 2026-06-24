'use client';

import { Copy, Diamond, Fingerprint, Hash, Key, Table2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn, copyToClipboard } from '@/lib/utils';

type InspectorColumn = {
  name: string;
  format: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  isIdentity?: boolean;
};

type InspectorTableProps = {
  schema: string;
  name: string;
  description?: string | null;
  columns: InspectorColumn[];
  className?: string;
};

function ColumnRow({ col }: { col: InspectorColumn }) {
  return (
    <div
      className={cn(
        'group flex h-12 items-center gap-3 border-t border-border-subtle bg-surface-1 px-4 transition-colors duration-fast ease-out hover:bg-surface-2'
      )}
    >
      <div className="flex w-24 items-center gap-1.5">
        {col.isPrimary && <Key size={14} strokeWidth={1.5} className="shrink-0 text-pk" />}
        {col.isIdentity && <Hash size={14} strokeWidth={1.5} className="shrink-0 text-id" />}
        {col.isUnique && <Fingerprint size={14} strokeWidth={1.5} className="shrink-0 text-uq" />}
        {col.isNullable ? (
          <Diamond size={14} strokeWidth={1.5} className="shrink-0 text-null" />
        ) : (
          <Diamond size={14} strokeWidth={1.5} fill="currentColor" className="shrink-0 text-null" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between">
        <span className="truncate text-sm font-medium text-ink">{col.name}</span>
        <span className="ml-3 shrink-0 font-mono text-xs text-ink-3 group-hover:hidden">
          {col.format}
        </span>
      </div>
      <button
        type="button"
        onClick={() => copyToClipboard(col.name)}
        className="hidden h-6 w-6 shrink-0 items-center justify-center rounded text-ink-3 opacity-0 transition-opacity duration-fast ease-out hover:bg-surface-3 hover:text-ink group-hover:flex group-hover:opacity-100 focus-visible:flex focus-visible:opacity-100"
        title={`Copy column ${col.name}`}
        aria-label={`Copy column ${col.name}`}
      >
        <Copy size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function InspectorTable({
  schema,
  name,
  description,
  columns,
  className,
}: InspectorTableProps) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-border-strong bg-surface-1 text-ink shadow-md',
        className
      )}
    >
      <header className="flex h-12 items-center justify-between gap-3 border-b border-border-strong bg-surface-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Table2 size={16} strokeWidth={1.5} className="shrink-0 text-ink-3" />
          <span className="font-mono text-[11px] text-ink-3">{schema}</span>
          <span className="text-ink-3/60">.</span>
          <span className="truncate text-sm font-semibold text-ink">{name}</span>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(name)}
          className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-3 transition-colors duration-fast ease-out hover:bg-surface-3 hover:text-ink"
          title={`Copy table ${name}`}
          aria-label={`Copy table ${name}`}
        >
          <Copy size={12} strokeWidth={1.5} />
        </button>
      </header>
      {description && (
        <p className="border-b border-border-subtle bg-surface-1 px-4 py-2 text-xs text-ink-3">
          {description}
        </p>
      )}
      <div className="flex h-9 items-center gap-3 border-b border-border-subtle bg-surface-1 px-4 font-mono text-[10px] uppercase tracking-tight text-ink-3">
        <span className="w-24">constraints</span>
        <span className="flex-1">column</span>
        <span className="shrink-0">type</span>
        <span className="w-6" aria-hidden="true" />
      </div>
      {columns.map((col) => (
        <ColumnRow key={col.name} col={col} />
      ))}
    </article>
  );
}

export type Relation = {
  schema: string;
  table: string;
  via: string;
  direction: 'out' | 'in';
};

export function RelationChip({ relation, icon }: { relation: Relation; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border-strong bg-surface-1 px-2.5 py-1.5 text-xs">
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-surface-2 text-ink-3">
        {icon}
      </span>
      <span className="font-mono text-[10px] text-ink-3">{relation.schema}</span>
      <span className="text-ink-3/60">.</span>
      <span className="font-medium text-ink">{relation.table}</span>
      <span className="text-ink-3/60">·</span>
      <span className="font-mono text-[10px] text-ink-2">{relation.via}</span>
      <span
        className={cn(
          'ml-1 inline-flex h-4 items-center rounded-sm px-1 font-mono text-[9px] uppercase tracking-tight',
          relation.direction === 'out' ? 'bg-accent/15 text-accent' : 'bg-info/15 text-info'
        )}
      >
        {relation.direction === 'out' ? '→' : '←'}
      </span>
    </div>
  );
}
