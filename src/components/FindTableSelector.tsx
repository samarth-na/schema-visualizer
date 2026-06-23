'use client';

import { Search } from 'lucide-react';
import { forwardRef, useMemo, useState } from 'react';
import type { ParsedTable } from '@/lib/types';
import { cn } from '@/lib/utils';

type FindTableSelectorProps = {
  tables: ParsedTable[];
  onSelect: (tableName: string) => void;
  disabled?: boolean;
};

export const FindTableSelector = forwardRef<HTMLDivElement, FindTableSelectorProps>(
  ({ tables, onSelect, disabled }, ref) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
      const term = search.trim().toLowerCase();
      if (!term) return tables;
      return tables.filter((t) => {
        const qualified = `${t.schema}.${t.name}`.toLowerCase();
        return qualified.includes(term);
      });
    }, [tables, search]);

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex h-7 items-center gap-2 rounded-md border border-border-strong bg-surface-2 px-2.5 text-xs font-medium text-ink-2 transition-colors duration-fast ease-out hover:bg-surface-3 hover:text-ink disabled:opacity-40',
            open && 'border-accent text-ink'
          )}
        >
          <Search size={12} strokeWidth={1.5} className="text-ink-3" />
          Find table…
        </button>

        {open && (
          <div className="z-dropdown absolute left-0 top-full mt-1 w-64 overflow-hidden rounded-md border border-border-strong bg-surface-1 shadow-md">
            <input
              autoFocus
              type="text"
              placeholder="Filter tables…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-b border-border-subtle bg-surface-1 px-3 py-2 text-xs text-ink outline-none placeholder:text-ink-3"
            />
            <ul className="max-h-52 overflow-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-ink-3">No tables found</li>
              )}
              {filtered.map((table) => (
                <li key={table.name}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(`${table.schema}.${table.name}`);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="w-full px-3 py-1.5 text-left font-mono text-xs text-ink-2 transition-colors duration-fast ease-out hover:bg-surface-2 hover:text-ink"
                  >
                    {`${table.schema}.${table.name}`}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

FindTableSelector.displayName = 'FindTableSelector';
