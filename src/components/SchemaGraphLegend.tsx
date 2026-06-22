'use client'

import { DiamondIcon, Fingerprint, Hash, Key } from 'lucide-react'

export function SchemaGraphLegend() {
  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800 flex justify-center px-1 py-2 shadow-md bg-white/90 dark:bg-zinc-900/90 w-full z-10">
      <ul className="flex flex-wrap items-center justify-center gap-4">
        <li className="flex items-center text-xs font-mono gap-1 text-zinc-700 dark:text-zinc-300">
          <Key size={15} strokeWidth={1.5} className="shrink-0 text-zinc-500" />
          Primary key
        </li>
        <li className="flex items-center text-xs font-mono gap-1 text-zinc-700 dark:text-zinc-300">
          <Hash size={15} strokeWidth={1.5} className="shrink-0 text-zinc-500" />
          Identity
        </li>
        <li className="flex items-center text-xs font-mono gap-1 text-zinc-700 dark:text-zinc-300">
          <Fingerprint size={15} strokeWidth={1.5} className="shrink-0 text-zinc-500" />
          Unique
        </li>
        <li className="flex items-center text-xs font-mono gap-1 text-zinc-700 dark:text-zinc-300">
          <DiamondIcon size={15} strokeWidth={1.5} className="shrink-0 text-zinc-500" />
          Nullable
        </li>
        <li className="flex items-center text-xs font-mono gap-1 text-zinc-700 dark:text-zinc-300">
          <DiamondIcon
            size={15}
            strokeWidth={1.5}
            fill="currentColor"
            className="shrink-0 text-zinc-500"
          />
          Non-Nullable
        </li>
      </ul>
    </div>
  )
}
