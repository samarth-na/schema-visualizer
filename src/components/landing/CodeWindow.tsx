import { cn } from '@/lib/utils';

type CodeWindowProps = {
  filename?: string;
  language?: string;
  code: string;
  className?: string;
  minLines?: number;
};

export function CodeWindow({
  filename,
  language = 'sql',
  code,
  className,
  minLines = 1,
}: CodeWindowProps) {
  const lineCount = Math.max(code.split('\n').length, minLines);

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-md border border-border-strong bg-surface-1 shadow-sm',
        className
      )}
    >
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-2 px-3">
        <div className="flex items-center gap-2 font-mono text-[10px] text-ink-3">
          <span aria-hidden="true" className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
          </span>
          {filename && <span className="text-ink-2">{filename}</span>}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-tight text-ink-3">
          {language}
        </span>
      </div>
      <pre
        className={cn(
          'flex-1 overflow-auto px-4 py-3 font-mono text-[12px] leading-[1.55] text-ink-2'
        )}
        style={{ minHeight: `${lineCount * 1.55}em` }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
