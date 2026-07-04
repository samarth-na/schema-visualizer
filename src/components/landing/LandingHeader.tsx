import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/ThemeToggle';

export function LandingHeader() {
  return (
    <header className="z-sticky sticky top-0 flex h-12 items-center justify-between border-b border-border-subtle bg-bg/80 px-6 backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
        <span className="text-sm font-semibold tracking-tight">SQL Schema Visualizer</span>
      </Link>
      <div className="flex items-center gap-1">
        <a
          href="#capabilities"
          className="hidden rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-fast ease-out hover:bg-surface-2 hover:text-ink sm:inline-flex"
        >
          Capabilities
        </a>
        <a
          href="#how-it-works"
          className="hidden rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-fast ease-out hover:bg-surface-2 hover:text-ink sm:inline-flex"
        >
          How it works
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
