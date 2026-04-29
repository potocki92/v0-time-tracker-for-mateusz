const TIMER_LOGS = [
  { name: 'Spotkanie kickoff', time: '45:12' },
  { name: 'Research konkurencji', time: '1:12:03' },
  { name: 'Wireframes', time: '2:47:21' },
] as const

export function TimerVisual() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktualny wpis</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          LIVE
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold">Landing page — rewizja V2</p>
      <p className="mt-1 text-xs text-muted-foreground">Klient: Acme Sp. z o.o.</p>
      <div className="mt-6 font-mono text-5xl font-semibold tabular-nums tracking-tight">01:23:47</div>
      <div className="mt-6 space-y-2">
        {TIMER_LOGS.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs"
          >
            <span className="truncate font-medium">{item.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
