'use client'

import { SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { TrendingUp } from 'lucide-react'
import type { CURRENCY } from '@/lib/types'
import { formatMoney, toMinor } from '@/lib/format'
import type { CashflowMonth } from '../../domain/stats'

interface InvoiceCashflowCardProps {
  cashflow: CashflowMonth[]
  total: number
  trendPercent: number | null
  currency: CURRENCY
  highlightLast?: boolean
}

export function InvoiceCashflowCard({
  cashflow,
  total,
  trendPercent,
  currency,
  highlightLast = true,
}: InvoiceCashflowCardProps) {
  const max = cashflow.reduce((m, c) => Math.max(m, c.total), 0)
  const trendBadge =
    trendPercent === null
      ? null
      : `${trendPercent > 0 ? '+' : ''}${trendPercent}%`

  return (
    <section className={cn(SURFACE.card, 'p-4 sm:p-5')}>
      <header className="flex items-center justify-between gap-3">
        <SectionEyebrow>PRZEPŁYW · 6 MIESIĘCY</SectionEyebrow>
        {trendBadge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-2xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30 tabular-nums">
            <TrendingUp className="h-3 w-3" aria-hidden />
            {trendBadge}
          </span>
        )}
      </header>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-white sm:text-4xl">
          {formatMoney(toMinor(total), currency)}
        </span>
        <span className="text-xs text-zinc-400">łącznie wystawione</span>
      </div>

      <div
        className="mt-5 grid h-32 grid-cols-6 items-end gap-2 sm:gap-3"
        role="group"
        aria-label="Wartość wystawionych faktur w ostatnich 6 miesiącach"
      >
        {cashflow.map((m, idx) => {
          const ratio = max > 0 ? Math.max(m.total / max, m.total > 0 ? 0.06 : 0.02) : 0.02
          const isLast = idx === cashflow.length - 1
          return (
            <div key={`${m.year}-${m.monthIndex}`} className="flex h-full flex-col justify-end">
              <span
                className={
                  highlightLast && isLast
                    ? 'block rounded-md bg-emerald-500 shadow-[0_0_22px_-6px_color-mix(in_oklab,var(--primary)_70%,transparent)]'
                    : 'block rounded-md bg-emerald-500/30'
                }
                style={{ height: `${Math.round(ratio * 100)}%` }}
                role="img"
                aria-label={`${m.label}: ${formatMoney(toMinor(m.total), currency)}`}
              />
            </div>
          )
        })}
      </div>

      <ul className="mt-2 grid grid-cols-6 gap-2 text-center text-2xs uppercase tracking-wide text-zinc-400 sm:gap-3">
        {cashflow.map((m) => (
          <li key={`${m.year}-${m.monthIndex}-label`}>{m.label}</li>
        ))}
      </ul>
    </section>
  )
}
