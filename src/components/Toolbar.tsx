'use client'

import { Check, Copy, LayoutGrid } from 'lucide-react'
import { useState } from 'react'

import { FindTableSelector } from './FindTableSelector'
import type { ParsedTable } from '@/lib/types'

type ToolbarProps = {
  tables: ParsedTable[]
  disabled: boolean
  onResetLayout: () => void
  onFindTable: (tableName: string) => void
  onCopySQL: () => void
  onCopyMarkdown: () => void
  onDownloadPng?: () => void
  onDownloadSvg?: () => void
  isDownloading?: boolean
}

const toolbarButtonClass =
  'flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'

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
  const [copied, setCopied] = useState<'sql' | 'md' | null>(null)

  const handleCopy = (type: 'sql' | 'md') => {
    if (type === 'sql') onCopySQL()
    else onCopyMarkdown()
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <FindTableSelector tables={tables} onSelect={onFindTable} disabled={disabled} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || isDownloading}
          onClick={() => handleCopy('sql')}
          className={toolbarButtonClass}
        >
          {copied === 'sql' ? <Check size={14} /> : <Copy size={14} />}
          Copy SQL
        </button>
        <button
          type="button"
          disabled={disabled || isDownloading}
          onClick={() => handleCopy('md')}
          className={toolbarButtonClass}
        >
          {copied === 'md' ? <Check size={14} /> : <Copy size={14} />}
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
          <LayoutGrid size={14} />
          Auto layout
        </button>
      </div>
    </div>
  )
}
