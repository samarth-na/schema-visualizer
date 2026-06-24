import { cn } from '@/lib/utils';

type HeroBadgeProps = {
  index: number;
  total: number;
  concept: string;
  className?: string;
};

export function HeroBadge({ index, total, concept, className }: HeroBadgeProps) {
  return (
    <div
      className={cn('inline-flex items-center gap-2 font-mono text-[11px] text-ink-2', className)}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-5 items-center rounded-sm border border-border-strong bg-surface-2 px-1.5 text-[10px] font-medium text-ink"
      >
        design {index.toString().padStart(2, '0')} / {total.toString().padStart(2, '0')}
      </span>
      <span className="text-ink-3">{concept}</span>
    </div>
  );
}
