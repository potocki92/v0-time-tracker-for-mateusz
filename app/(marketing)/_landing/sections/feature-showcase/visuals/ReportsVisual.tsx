const REPORT_BARS = [40, 62, 55, 78, 48, 90, 72] as const
const REPORT_DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'] as const
const REPORT_SUMMARY = [
  { k: 'Suma', v: '34,2h' },
  { k: 'Śr./dzień', v: '4,9h' },
  { k: 'Przychód', v: '6 840 zł' },
] as const

export function ReportsVisual() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Produktywność — ostatnie 7 dni</p>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
          +18%
        </span>
      </div>
      <div className="mt-6 flex h-40 items-end gap-3">
        {REPORT_BARS.map((height, index) => (
          <div key={REPORT_DAYS[index]} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary"
              style={{ height: `${height}%` }}
            />
            <span className="text-[10px] font-medium text-muted-foreground">{REPORT_DAYS[index]}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
        {REPORT_SUMMARY.map((summary) => (
          <div key={summary.k}>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{summary.k}</p>
            <p className="mt-1 font-mono text-base font-semibold tabular-nums">{summary.v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
