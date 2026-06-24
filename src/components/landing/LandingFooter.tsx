import { Sparkles } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-border-subtle px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-2 text-ink-3">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium">SQL Schema Visualizer</span>
        </div>
        <p className="text-xs text-ink-3">Open source. Client-side. No tracking.</p>
      </div>
    </footer>
  );
}
