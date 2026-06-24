import Link from 'next/link';
import type { ReactNode } from 'react';
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { cn } from '@/lib/utils';

type CtaVariant = 'primary' | 'secondary';

type PageShellProps = {
  activeSlug: '1' | '2' | '3' | '4' | '5';
  hero: ReactNode;
  heroClassName?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  showSections?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
};

const baseButton =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-medium transition-all duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

const ctaVariants: Record<CtaVariant, string> = {
  primary:
    'border-button-border bg-button-bg text-ink shadow-card hover:-translate-y-0.5 hover:bg-surface-2',
  secondary:
    'border-border-subtle bg-transparent text-ink-2 hover:border-border-strong hover:bg-surface-2 hover:text-ink',
};

export function PageShell({
  activeSlug,
  hero,
  heroClassName,
  primaryCta,
  secondaryCta,
  showSections = true,
  showHeader = true,
  showFooter = true,
}: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      {showHeader && <LandingHeader activeSlug={activeSlug} />}

      <main className="flex-1">
        <section className={cn('px-6 pt-8 pb-10 sm:pt-10 sm:pb-12', heroClassName)}>
          {hero}
          {primaryCta && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={primaryCta.href} className={cn(baseButton, ctaVariants.primary)}>
                {primaryCta.label}
              </Link>
              {secondaryCta && (
                <Link href={secondaryCta.href} className={cn(baseButton, ctaVariants.secondary)}>
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </section>

        {showSections && (
          <>
            <CapabilitiesSection />
            <HowItWorksSection />
          </>
        )}
      </main>

      {showFooter && <LandingFooter />}
    </div>
  );
}
