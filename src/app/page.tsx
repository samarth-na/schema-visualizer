import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { HeroFinal } from '@/components/landing/heroes/HeroFinal';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <LandingHeader />

      <main className="flex-1">
        <section className="px-6 pt-12 pb-12 sm:pt-16 sm:pb-14">
          <HeroFinal />

          <div className="mx-auto mt-10 max-w-6xl">
            <Link
              href="/app"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-button-border bg-button-bg px-5 text-sm font-medium text-ink shadow-card transition-all duration-fast ease-out hover:-translate-y-0.5 hover:bg-surface-2"
            >
              Visualize your schema
              <ArrowRight className="h-4 w-4" />
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
