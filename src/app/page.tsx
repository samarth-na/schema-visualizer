'use client'

import { ReactFlowProvider } from '@xyflow/react'
import { Loader2, Sparkles, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Toaster, toast } from 'sonner'

import { SchemaGraphCanvas } from '@/components/SchemaGraphCanvas'
import { cn } from '@/lib/utils'
import { formatParseError, parseSql } from '@/lib/parseSql'
import { SAMPLE_SCHEMA } from '@/lib/sampleSchema'
import type { ParsedSchema } from '@/lib/types'

export default function Home() {
  const [sql, setSql] = useState('')
  const [schema, setSchema] = useState<ParsedSchema>({ tables: [], relationships: [] })
  const [selectedSchema, setSelectedSchema] = useState<string>('')
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schemaNames = useMemo(() => {
    const names = Array.from(new Set(schema.tables.map((t) => t.schema)))
    return names.sort()
  }, [schema])

  const handleRender = () => {
    setError(null)
    setIsRendering(true)
    try {
      const parsed = parseSql(sql)
      setSchema(parsed)
      const names = Array.from(new Set(parsed.tables.map((t) => t.schema))).sort()
      setSelectedSchema(names[0] ?? '')
      if (parsed.tables.length === 0) {
        toast.info('No CREATE TABLE statements found in the pasted SQL.')
      } else {
        toast.success(`Rendered ${parsed.tables.length} tables, ${parsed.relationships.length} relationships`)
      }
    } catch (err) {
      const message = formatParseError(err)
      setError(message)
      toast.error('Failed to parse SQL')
    } finally {
      setIsRendering(false)
    }
  }

  const handleLoadExample = () => {
    setSql(SAMPLE_SCHEMA)
    setError(null)
    // Auto-render after a tick so the textarea updates first
    setTimeout(() => {
      try {
        const parsed = parseSql(SAMPLE_SCHEMA)
        setSchema(parsed)
        const names = Array.from(new Set(parsed.tables.map((t) => t.schema))).sort()
        setSelectedSchema(names[0] ?? '')
        toast.success(`Loaded example schema: ${parsed.tables.length} tables`)
      } catch (err) {
        setError(formatParseError(err))
      }
    }, 0)
  }

  const handleClear = () => {
    setSql('')
    setSchema({ tables: [], relationships: [] })
    setSelectedSchema('')
    setError(null)
  }

  const filteredSchema = useMemo(() => {
    if (!selectedSchema) return schema
    return {
      tables: schema.tables.filter((t) => t.schema === selectedSchema),
      relationships: schema.relationships.filter(
        (r) =>
          schema.tables.find((t) => t.name === r.sourceTable && t.schema === selectedSchema) !==
          undefined
      ),
    }
  }, [schema, selectedSchema])

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Toaster position="top-center" richColors />
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">SQL Schema Visualizer</h1>
        </div>
        <div className="text-xs text-zinc-500">Paste DDL → render graph</div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* SQL input panel */}
        <section className="flex w-full flex-col border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 lg:w-[420px] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">SQL Input</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadExample}
                className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                Load example
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>
          </div>

          <div className="relative flex-1">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Paste your CREATE TABLE statements here..."
              spellCheck={false}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-xs leading-5 text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
            />
          </div>

          {error && (
            <div className="mx-4 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={handleRender}
              disabled={isRendering || !sql.trim()}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50',
                isRendering && 'cursor-wait'
              )}
            >
              {isRendering && <Loader2 size={16} className="animate-spin" />}
              Render Graph
            </button>
          </div>

          {schemaNames.length > 1 && (
            <div className="flex items-center gap-2 border-t border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Schema:</label>
              <select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
              >
                {schemaNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* Graph canvas */}
        <section className="relative flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          <ReactFlowProvider>
            <SchemaGraphCanvas schema={filteredSchema} selectedSchemaName={selectedSchema} />
          </ReactFlowProvider>
        </section>
      </div>
    </main>
  )
}
