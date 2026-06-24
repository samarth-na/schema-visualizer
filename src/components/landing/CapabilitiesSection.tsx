export function CapabilitiesSection() {
  const items = [
    {
      title: 'Interactive canvas',
      description:
        'Pan, zoom, and drag nodes. Hover to trace foreign keys across tables and schemas.',
    },
    {
      title: 'Auto layout',
      description: 'Tables arrange themselves to minimize edge crossings. Reset any time.',
    },
    {
      title: 'Multi-schema support',
      description:
        'Switch between schemas to focus on one area, or view cross-schema foreign keys at a glance.',
    },
    {
      title: 'Export to PNG and SVG',
      description:
        'Download a high-resolution image of your diagram for docs, slides, or pull requests.',
    },
    {
      title: 'Privacy first',
      description:
        'All parsing and rendering happens in your browser. Your SQL never leaves the client.',
    },
    {
      title: 'Copy as SQL or Markdown',
      description:
        'Round-trip a schema between your editor, a doc, and the visualizer without losing structure.',
    },
  ];

  return (
    <section id="capabilities" className="border-t border-border-subtle bg-surface-1 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-[11px] text-ink-3">capabilities</p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Everything you need to explore a schema.
          </h2>
          <p className="mt-3 text-pretty text-sm text-ink-2 sm:text-base">
            Built for engineers who want to understand a database layout in seconds, not hours.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-md border border-border-strong bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col gap-2 bg-surface-1 p-5">
              <div className="h-1 w-6 rounded-full bg-accent" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
              <p className="text-sm text-ink-2">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
