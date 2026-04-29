import { MotionItem, MotionStagger } from '@/app/_landing/ui/MotionReveal'

import { STATS_STRIP_ITEMS } from './data'

export function StatsStripSection() {
  return (
    <section aria-label="Kluczowe statystyki" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <MotionStagger className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS_STRIP_ITEMS.map((stat) => (
            <MotionItem key={stat.label}>
              <div className="rounded-2xl border border-border/70 bg-background/60 p-5 text-center shadow-sm backdrop-blur sm:text-left">
                <dt className="order-2 text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="order-1 font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {stat.value}
                </dd>
              </div>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  )
}
