import { HeroInputOutput } from '@/components/landing/heroes/HeroInputOutput';
import { PageShell } from '@/components/landing/PageShell';

export default function HeroOnePage() {
  return (
    <PageShell
      activeSlug="1"
      hero={<HeroInputOutput />}
      primaryCta={{ label: 'Open the visualizer', href: '/app' }}
      secondaryCta={{ label: 'How it works', href: '#how-it-works' }}
    />
  );
}
