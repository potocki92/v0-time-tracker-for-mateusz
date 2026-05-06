'use client'

interface InvoicesPageHeaderProps {
  monthLabel: string
  cycleLabel: string
  currency: string
  year: number
}

export function InvoicesPageHeader({
  monthLabel,
  cycleLabel,
  currency,
  year,
}: InvoicesPageHeaderProps) {
  return (
    <header className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {monthLabel} {year} · CYKL {cycleLabel} · {currency}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Faktury
      </h1>
      <p className="text-sm text-zinc-500">
        Wystawione, wysłane, w księgach.
      </p>
    </header>
  )
}
