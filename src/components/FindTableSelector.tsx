'use client'

import { Search } from 'lucide-react'
import { forwardRef, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import type { ParsedTable } from '@/lib/types'

type FindTableSelectorProps = {
  tables: ParsedTable[]
  onSelect: (tableName: string) => void
  disabled?: boolean
}

export const FindTableSelector = forwardRef<HTMLDivElement, FindTableSelectorProps>(
  ({ tables, onSelect, disabled }, ref) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
      const term = search.trim().toLowerCase()
      if (!term) return tables
      return tables.filter((t) => {
        const qualified = `${t.schema}.${t.name}`.toLowerCase()
        return qualified.includes(term)
      })
    }, [tables, search])

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
            open && 'ring-2 ring-blue-500 ring-offset-1'
          )}
        >
          <Search size={14} strokeWidth={1.5} className="text-zinc-500" />
          Find table…
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <input
              autoFocus
              type="text"
              placeholder="Filter tables…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-b border-zinc-200 px-3 py-2 text-xs outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <ul className="max-h-52 overflow-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-zinc-500">No tables found</li>
              )}
              {filtered.map((table) => (
                <li key={table.name}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(`${table.schema}.${table.name}`)
                      setOpen(false)
                      setSearch('')
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {`${table.schema}.${table.name}`}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
)

FindTableSelector.displayName = 'FindTableSelector'
