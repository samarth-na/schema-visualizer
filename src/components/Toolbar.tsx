'use client';

import { Check, Copy, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import type { ParsedTable } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FindTableSelector } from './FindTableSelector';

type ToolbarProps = {
  tables: ParsedTable[];
  disabled: boolean;
  onResetLayout: () => void;
  onFindTable: (tableName: string) => void;
  onCopySQL: () => void;
  onCopyMarkdown: () => void;
  onDownloadPng?: () => void;
  onDownloadSvg?: () => void;
  isDownloading?: boolean;
};

const toolbarButtonClass = cn(
  'inline-flex h-7 items-center gap-1.5 rounded-md border border-border-strong bg-surface-2 px-2.5',
  'text-xs font-medium text-ink-2',
  'transition-colors duration-fast ease-out',
  'hover:bg-surface-3 hover:text-ink',
  'disabled:opacity-40 disabled:hover:bg-surface-2 disabled:hover:text-ink-2'
);

export function Toolbar({
  tables,
  disabled,
  onResetLayout,
  onFindTable,
  onCopySQL,
  onCopyMarkdown,
  onDownloadPng,
  onDownloadSvg,
  isDownloading,
}: ToolbarProps) {
  const [copied, setCopied] = useState<'sql' | 'md' | null>(null);

  const handleCopy = (type: 'sql' | 'md') => {
    if (type === 'sql') onCopySQL();
    else onCopyMarkdown();
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="z-sticky flex h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-surface-1 px-3">
      <div className="flex items-center gap-2">
        <FindTableSelector tables={tables} onSelect={onFindTable} disabled={disabled} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || isDownloading}
          onClick={() => handleCopy('sql')}
          className={toolbarButtonClass}
        >
          {copied === 'sql' ? (
            <Check size={12} strokeWidth={1.5} />
          ) : (
            <Copy size={12} strokeWidth={1.5} />
          )}
          Copy SQL
        </button>
        <button
          type="button"
          disabled={disabled || isDownloading}
          onClick={() => handleCopy('md')}
          className={toolbarButtonClass}
        >
          {copied === 'md' ? (
            <Check size={12} strokeWidth={1.5} />
          ) : (
            <Copy size={12} strokeWidth={1.5} />
          )}
          Copy Markdown
        </button>
        {onDownloadPng && (
          <button
            type="button"
            disabled={disabled || isDownloading}
            onClick={onDownloadPng}
            className={toolbarButtonClass}
          >
            PNG
          </button>
        )}
        {onDownloadSvg && (
          <button
            type="button"
            disabled={disabled || isDownloading}
            onClick={onDownloadSvg}
            className={toolbarButtonClass}
          >
            SVG
          </button>
        )}
        <button
          type="button"
          disabled={disabled || isDownloading}
          onClick={onResetLayout}
          className={toolbarButtonClass}
        >
          <LayoutGrid size={12} strokeWidth={1.5} />
          Auto layout
        </button>
      </div>
    </div>
  );
}
