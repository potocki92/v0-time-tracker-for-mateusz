const INVOICE_ROWS = [
  { label: 'Projektowanie UI', value: '3 200,00 zł' },
  { label: 'Spotkania + konsultacje', value: '960,00 zł' },
  { label: 'Rewizje graficzne', value: '480,00 zł' },
] as const

export function InvoiceVisual() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <p className="text-lg font-semibold">Faktura FV/04/2025</p>
          <p className="text-xs text-muted-foreground">Termin płatności: 7 dni</p>
        </div>
        <span className="rounded-md bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning-foreground">
          Do wysyłki
        </span>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {INVOICE_ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-semibold">Do zapłaty</span>
        <span className="font-mono text-2xl font-semibold tabular-nums">4 640,00 zł</span>
      </div>
    </div>
  )
}
