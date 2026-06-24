import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

type HeroVariantMeta = {
  index: number;
  slug: '1' | '2' | '3' | '4' | '5';
  label: string;
  href: string;
};

const HERO_VARIANTS: HeroVariantMeta[] = [
  { index: 1, slug: '1', label: 'Input → Output', href: '/1' },
  { index: 2, slug: '2', label: 'Off-Edge', href: '/2' },
  { index: 3, slug: '3', label: 'Annotated', href: '/3' },
  { index: 4, slug: '4', label: 'Inspector', href: '/4' },
  { index: 5, slug: '5', label: 'Stack', href: '/5' },
];

export function LandingHeader({ activeSlug }: { activeSlug?: HeroVariantMeta['slug'] }) {
  return (
    <header className="z-sticky sticky top-0 flex h-12 items-center justify-between border-b border-border-subtle bg-bg/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">SQL Schema Visualizer</span>
        </Link>
        <span aria-hidden="true" className="hidden h-3.5 w-px bg-border-subtle sm:inline-block" />
        <nav aria-label="Hero variants" className="hidden items-center gap-0.5 sm:flex">
          {HERO_VARIANTS.map((variant) => {
            const isActive = activeSlug === variant.slug;
            return (
              <Link
                key={variant.slug}
                href={variant.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] transition-colors duration-fast ease-out',
                  isActive
                    ? 'bg-surface-2 text-ink'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                )}
              >
                <span className="text-ink-3">{variant.index.toString().padStart(2, '0')}</span>
                <span>{variant.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
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

export type { HeroVariantMeta };
export { HERO_VARIANTS };
