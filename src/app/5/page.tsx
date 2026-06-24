import { HeroLayered } from '@/components/landing/heroes/HeroLayered';
import { PageShell } from '@/components/landing/PageShell';

export default function HeroFivePage() {
  return (
    <PageShell
      activeSlug="5"
      hero={<HeroLayered />}
      primaryCta={{ label: 'Open the visualizer', href: '/app' }}
      secondaryCta={{ label: 'Capabilities', href: '#capabilities' }}
    />
  );
}
