import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection';
import { HeroFinal } from '@/components/landing/HeroFinal';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <LandingHeader />

      <main className="flex-1">
        <section className="px-6 pt-12 pb-12 sm:pt-16 sm:pb-14">
          <HeroFinal />

          <div className="mx-auto mt-12 max-w-6xl sm:mt-14">
            <p
              id="cta-eyebrow"
              className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3"
            >
              <span
                aria-hidden="true"
                className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent"
              />
              free · no signup · runs in your browser
            </p>
            <Link
              href="/app"
              aria-describedby="cta-eyebrow"
              className="group inline-flex h-12 items-center gap-2.5 rounded-lg bg-primary px-7 text-base font-semibold text-on-primary transition-colors duration-fast ease-out hover:bg-primary-hover active:bg-primary-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:h-13 sm:px-8 sm:text-[1.0625rem]"
            >
              <Sparkles className="h-5 w-5 transition-transform duration-base ease-out group-hover:rotate-12" />
              Visualize your schema
              <ArrowRight className="h-5 w-5 transition-transform duration-base ease-out group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        <CapabilitiesSection />
        <HowItWorksSection />
      </main>

      <LandingFooter />
    </div>
  );
}
