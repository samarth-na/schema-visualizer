'use client';

import { AnnotatedGraph } from '@/components/landing/AnnotatedGraph';
import { HeroBadge } from '@/components/landing/HeroBadge';

export function HeroAnnotated() {
  return (
    <div className="mx-auto max-w-6xl">
      <HeroBadge index={3} total={5} concept="annotated · instrument" className="mb-6" />

      <p className="font-mono text-[11px] text-ink-3">
        <span className="text-ink-2">{'// '}</span>
        the visualizer is a working surface — every glyph is a contract
      </p>

      <div className="mt-6">
        <AnnotatedGraph />
      </div>
    </div>
  );
}
