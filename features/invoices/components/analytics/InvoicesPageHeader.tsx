'use client'

import { cn } from '@/lib/utils'
import type { CURRENCY } from '@/lib/types'

interface InvoicesPageHeaderProps {
  monthLabel: string
  cycleLabel: string
  currency: CURRENCY
  onCurrencyChange: (currency: CURRENCY) => void
  year: number
}

const CURRENCIES: CURRENCY[] = ['PLN', 'EUR']

export function InvoicesPageHeader({
  monthLabel,
  cycleLabel,
  currency,
  onCurrencyChange,
  year,
}: InvoicesPageHeaderProps) {
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {monthLabel} {year} · CYKL {cycleLabel}
        </p>
        <div
          className="inline-flex gap-0.5 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] p-0.5"
          role="tablist"
          aria-label="Waluta faktur"
        >
          {CURRENCIES.map((value) => {
            const active = value === currency
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onCurrencyChange(value)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-2xs font-semibold uppercase tracking-[0.1em] transition',
                  active
                    ? 'bg-emerald-500/10 text-emerald-200'
                    : 'text-zinc-400 hover:text-white',
                )}
              >
                {value}
              </button>
            )
          })}
        </div>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Faktury
      </h1>
      <p className="text-sm text-muted-foreground">
        Wystawione, wysłane, w księgach.
      </p>
    </header>
  )
}
