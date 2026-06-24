import { HeroInspector } from '@/components/landing/heroes/HeroInspector';
import { PageShell } from '@/components/landing/PageShell';

export default function HeroFourPage() {
  return (
    <PageShell
      activeSlug="4"
      hero={<HeroInspector />}
      primaryCta={{ label: 'See the full schema', href: '/app' }}
      secondaryCta={{ label: 'Capabilities', href: '#capabilities' }}
    />
  );
}
