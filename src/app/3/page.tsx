import { HeroAnnotated } from '@/components/landing/heroes/HeroAnnotated';
import { PageShell } from '@/components/landing/PageShell';

export default function HeroThreePage() {
  return (
    <PageShell
      activeSlug="3"
      hero={<HeroAnnotated />}
      primaryCta={{ label: 'Open the visualizer', href: '/app' }}
      secondaryCta={{ label: 'How it works', href: '#how-it-works' }}
    />
  );
}
