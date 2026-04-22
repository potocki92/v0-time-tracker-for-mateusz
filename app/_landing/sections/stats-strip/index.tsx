import { STATS_STRIP_ITEMS } from './data'

export function StatsStripSection() {
  return (
    <section aria-label="Kluczowe statystyki" className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS_STRIP_ITEMS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <dt className="order-2 text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="order-1 font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
