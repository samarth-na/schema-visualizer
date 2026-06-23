'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';

import { SchemaGraphCanvas } from '@/components/SchemaGraphCanvas';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatParseError, parseSql } from '@/lib/parseSql';
import { SAMPLE_SCHEMA } from '@/lib/sampleSchema';
import type { ParsedSchema } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AppPage() {
  const [sql, setSql] = useState('');
  const [schema, setSchema] = useState<ParsedSchema>({
    tables: [],
    relationships: [],
  });
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schemaNames = useMemo(() => {
    const names = Array.from(new Set(schema.tables.map((t) => t.schema)));
    return names.sort();
  }, [schema]);

  const handleRender = () => {
    setError(null);
    setIsRendering(true);
    try {
      const parsed = parseSql(sql);
      setSchema(parsed);
      const names = Array.from(new Set(parsed.tables.map((t) => t.schema))).sort();
      setSelectedSchema(names[0] ?? '');
      if (parsed.tables.length === 0) {
        toast.info('No CREATE TABLE statements found in the pasted SQL.');
      } else {
        toast.success(
          `Rendered ${parsed.tables.length} tables, ${parsed.relationships.length} relationships`
        );
      }
    } catch (err) {
      const message = formatParseError(err);
      setError(message);
      toast.error('Failed to parse SQL');
    } finally {
      setIsRendering(false);
    }
  };

  const handleLoadExample = () => {
    setSql(SAMPLE_SCHEMA);
    setError(null);
    setTimeout(() => {
      try {
        const parsed = parseSql(SAMPLE_SCHEMA);
        setSchema(parsed);
        const names = Array.from(new Set(parsed.tables.map((t) => t.schema))).sort();
        setSelectedSchema(names[0] ?? '');
        toast.success(`Loaded example schema: ${parsed.tables.length} tables`);
      } catch (err) {
        setError(formatParseError(err));
      }
    }, 0);
  };

  const handleClear = () => {
    setSql('');
    setSchema({ tables: [], relationships: [] });
    setSelectedSchema('');
    setError(null);
  };

  const filteredSchema = useMemo(() => {
    if (!selectedSchema) return schema;
    return {
      tables: schema.tables.filter((t) => t.schema === selectedSchema),
      relationships: schema.relationships.filter(
        (r) => r.sourceSchema === selectedSchema || r.targetSchema === selectedSchema
      ),
    };
  }, [schema, selectedSchema]);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-bg text-ink">
      <Toaster
        position="top-center"
        theme="system"
        toastOptions={{
          classNames: {
            toast: 'bg-surface-2 text-ink border border-border-strong shadow-md rounded-md',
            description: 'text-ink-2',
            actionButton: 'bg-accent text-on-accent',
          },
        }}
      />

      <header className="z-sticky flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-1 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">SQL Schema Visualizer</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-ink-3 sm:inline">
            Paste DDL <span className="text-ink-3/60">→</span> render graph
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <section
          aria-label="SQL input"
          className="flex w-full shrink-0 flex-col overflow-hidden border-b border-border-subtle bg-surface-1 lg:w-[420px] lg:border-b-0 lg:border-r"
        >
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-border-subtle px-3">
            <span className="font-mono text-[11px] font-medium tracking-tight text-ink-2">sql</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLoadExample}
                className="rounded px-2 py-1 text-xs font-medium text-ink-2 transition-colors duration-fast ease-out hover:bg-surface-2 hover:text-ink"
              >
                Load example
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!sql && schema.tables.length === 0}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-ink-2 transition-colors duration-fast ease-out hover:bg-surface-2 hover:text-ink disabled:opacity-40"
              >
                <Trash2 size={12} strokeWidth={1.5} />
                Clear
              </button>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Paste your CREATE TABLE statements here…"
              spellCheck={false}
              aria-label="SQL DDL input"
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-[1.55] text-ink outline-none placeholder:text-ink-3"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mx-3 mb-3 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-xs text-error"
            >
              {error}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2 border-t border-border-subtle bg-surface-1 p-3">
            {schemaNames.length > 1 && (
              <>
                <label htmlFor="schema-selector" className="font-mono text-[11px] text-ink-3">
                  schema
                </label>
                <select
                  id="schema-selector"
                  value={selectedSchema}
                  onChange={(e) => setSelectedSchema(e.target.value)}
                  className="h-7 rounded-md border border-border-strong bg-surface-2 px-2 font-mono text-[11px] text-ink outline-none transition-colors duration-fast ease-out focus:border-accent"
                >
                  {schemaNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </>
            )}
            <button
              type="button"
              onClick={handleRender}
              disabled={isRendering || !sql.trim()}
              className={cn(
                'ml-auto flex h-8 items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-on-primary transition-colors duration-fast ease-out hover:bg-primary-hover active:bg-primary-pressed disabled:opacity-40',
                isRendering && 'cursor-progress'
              )}
            >
              {isRendering && <Loader2 size={14} className="animate-spin" />}
              Render graph
            </button>
          </div>
        </section>

        <section aria-label="Schema graph" className="relative flex-1 overflow-hidden bg-bg">
          <ReactFlowProvider>
            <SchemaGraphCanvas schema={filteredSchema} selectedSchemaName={selectedSchema} />
          </ReactFlowProvider>
        </section>
      </div>
    </main>
  );
}
