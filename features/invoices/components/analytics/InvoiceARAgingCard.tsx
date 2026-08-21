'use client'

import type { CURRENCY } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import type { InvoiceAgingBuckets } from '../../domain/stats'
import { MoreHorizontal } from 'lucide-react'

interface InvoiceARAgingCardProps {
  aging: InvoiceAgingBuckets
  currency: CURRENCY
}

const SEGMENTS = [
  { key: 'current' as const, color: 'bg-emerald-500', dot: 'bg-emerald-400', label: 'BIEŻĄCE' },
  { key: 'd1to15' as const, color: 'bg-lime-400', dot: 'bg-lime-300', label: '1–15 D' },
  { key: 'd16to30' as const, color: 'bg-amber-400', dot: 'bg-amber-300', label: '16–30 D' },
  { key: 'd30plus' as const, color: 'bg-red-500', dot: 'bg-red-400', label: '30+ D' },
] as const

function pluralFaktur(n: number): string {
  if (n === 1) return 'faktura'
  const lastTwo = n % 100
  const last = n % 10
  if (lastTwo >= 12 && lastTwo <= 14) return 'faktur'
  if (last >= 2 && last <= 4) return 'faktury'
  return 'faktur'
}

export function InvoiceARAgingCard({ aging, currency }: InvoiceARAgingCardProps) {
  const total = aging.total
  const segmentValues: Record<(typeof SEGMENTS)[number]['key'], number> = {
    current: aging.current,
    d1to15: aging.d1to15,
    d16to30: aging.d16to30,
    d30plus: aging.d30plus,
  }

  return (
    <section className="rounded-2xl border border-hairline bg-surface-1 p-4 sm:p-5">
      <header className="flex items-center justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          NALEŻNOŚCI · WIEKOWANIE
        </p>
        <button
          type="button"
          aria-label="Więcej opcji wiekowania"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-surface-3 hover:text-zinc-200"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-white sm:text-4xl">
          {formatCurrency(total, currency)}
        </span>
        <span className="text-xs text-zinc-400">
          do odzyskania · {aging.invoiceCount} {pluralFaktur(aging.invoiceCount)}
        </span>
      </div>

      <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-surface-3">
        {total > 0 ? (
          SEGMENTS.map((seg) => {
            const value = segmentValues[seg.key]
            if (value <= 0) return null
            const width = `${(value / total) * 100}%`
            return (
              <span
                key={seg.key}
                className={seg.color}
                style={{ width }}
                aria-hidden
              />
            )
          })
        ) : (
          <span className="w-full bg-surface-3" />
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {SEGMENTS.map((seg) => (
          <div key={seg.key} className="space-y-1">
            <dt className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              <span className={`h-2 w-2 rounded-full ${seg.dot}`} aria-hidden />
              {seg.label}
            </dt>
            <dd className="text-sm font-semibold tabular-nums text-white">
              {formatCurrency(segmentValues[seg.key], currency)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
