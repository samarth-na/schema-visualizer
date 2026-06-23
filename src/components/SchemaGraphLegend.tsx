'use client';

import { DiamondIcon, Fingerprint, Hash, Key } from 'lucide-react';

const legendItemClass = 'flex items-center gap-1.5 font-mono text-[11px] text-ink-2';

export function SchemaGraphLegend() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-sticky flex justify-center border-t border-border-subtle bg-surface-1/95 px-3 py-2 shadow-md backdrop-blur">
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <li className={legendItemClass}>
          <Key size={12} strokeWidth={1.5} className="shrink-0 text-pk" />
          <span>Primary key</span>
        </li>
        <li className={legendItemClass}>
          <Hash size={12} strokeWidth={1.5} className="shrink-0 text-id" />
          <span>Identity</span>
        </li>
        <li className={legendItemClass}>
          <Fingerprint size={12} strokeWidth={1.5} className="shrink-0 text-uq" />
          <span>Unique</span>
        </li>
        <li className={legendItemClass}>
          <DiamondIcon size={12} strokeWidth={1.5} className="shrink-0 text-null" />
          <span>Nullable</span>
        </li>
        <li className={legendItemClass}>
          <DiamondIcon
            size={12}
            strokeWidth={1.5}
            fill="currentColor"
            className="shrink-0 text-null"
          />
          <span>Not null</span>
        </li>
      </ul>
    </div>
  );
}
