const STEPS = [
  {
    n: '01',
    title: 'Paste your SQL',
    body: (
      <>
        Drop in <code className="font-mono text-[0.85em] text-ink">CREATE TABLE</code> statements
        with primary key, foreign key, and unique constraints.
      </>
    ),
  },
  {
    n: '02',
    title: 'Render the graph',
    body: 'The parser builds a table-and-column model and computes an automatic layout.',
  },
  {
    n: '03',
    title: 'Explore and export',
    body: 'Pan and zoom the canvas, filter by schema, and download a PNG or SVG when you are ready.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            How it works.
          </h2>
          <p className="mt-3 text-pretty text-sm text-ink-2 sm:text-base">
            From raw SQL to a clean ER diagram in three steps.
          </p>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="font-mono text-[11px] text-ink-3">{step.n}</span>
              <h3 className="mt-2 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
