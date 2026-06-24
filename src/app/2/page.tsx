import { HeroOffEdge } from '@/components/landing/heroes/HeroOffEdge';
import { PageShell } from '@/components/landing/PageShell';

export default function HeroTwoPage() {
  return (
    <PageShell
      activeSlug="2"
      hero={<HeroOffEdge />}
      primaryCta={{ label: 'Open the visualizer', href: '/app' }}
      secondaryCta={{ label: 'See the capabilities', href: '#capabilities' }}
    />
  );
}
