import { HERO_PROGRESS_ROWS, HERO_STATS } from './data'

function HeroProgressRows() {
  return (
    <div className="mt-6 space-y-3">
      {HERO_PROGRESS_ROWS.map((row) => (
        <div key={row.label}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{row.label}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{row.time}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${row.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function HeroStatCards() {
  return (
    <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5">
      {HERO_STATS.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          <p className="mt-1 font-mono text-base font-semibold tabular-nums">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

export function HeroVisual() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-chart-2/10 blur-2xl" />
      <div className="rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/80" />
          <span className="size-2.5 rounded-full bg-success/80" />
          <span className="ml-3 text-[11px] font-medium text-muted-foreground">workflow-pro.app/dashboard</span>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Aktywny projekt</p>
              <p className="mt-1 text-sm font-semibold">Redesign strony — Acme</p>
            </div>
            <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              ● Śledzenie
            </div>
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight">02:47:18</span>
            <span className="text-xs text-muted-foreground">dzisiaj</span>
          </div>

          <HeroProgressRows />
          <HeroStatCards />
        </div>
      </div>
    </div>
  )
}
