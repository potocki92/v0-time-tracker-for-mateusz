'use client'

import type { CURRENCY } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import type { InvoicesAggregateStats } from '../../domain/stats'
import { InvoiceStatCard } from './InvoiceStatCard'

interface InvoiceStatsGridProps {
  stats: InvoicesAggregateStats
  /** Same shape, computed for the other currency (no FX conversion — a plain native sum). */
  otherCurrencyStats: InvoicesAggregateStats
}

function formatTrendBadge(percent: number | null): string | undefined {
  if (percent === null) return undefined
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent}%`
}

function pluralFaktur(n: number): string {
  if (n === 1) return 'faktura'
  const lastTwo = n % 100
  const last = n % 10
  if (lastTwo >= 12 && lastTwo <= 14) return 'faktur'
  if (last >= 2 && last <= 4) return 'faktury'
  return 'faktur'
}

function pluralOpen(n: number): string {
  if (n === 1) return 'otwarta'
  const lastTwo = n % 100
  const last = n % 10
  if (lastTwo >= 12 && lastTwo <= 14) return 'otwartych'
  if (last >= 2 && last <= 4) return 'otwarte'
  return 'otwartych'
}

function pluralOverdue(n: number): string {
  if (n === 1) return 'zaległa'
  const lastTwo = n % 100
  const last = n % 10
  if (lastTwo >= 12 && lastTwo <= 14) return 'zaległych'
  if (last >= 2 && last <= 4) return 'zaległe'
  return 'zaległych'
}

function pluralDraft(n: number): string {
  if (n === 1) return 'szkic'
  const lastTwo = n % 100
  const last = n % 10
  if (lastTwo >= 12 && lastTwo <= 14) return 'szkiców'
  if (last >= 2 && last <= 4) return 'szkice'
  return 'szkiców'
}

export function InvoiceStatsGrid({ stats, otherCurrencyStats }: InvoiceStatsGridProps) {
  const currency = stats.currency as CURRENCY
  const otherCurrency = otherCurrencyStats.currency as CURRENCY

  const billedDescription =
    stats.period.count > 0
      ? `${stats.period.count} ${pluralFaktur(stats.period.count)} · ${stats.period.sentCount} wysłane`
      : 'Brak wystawionych w tym miesiącu'

  const paidBadge =
    stats.paid.avgDaysToPay !== null && stats.paid.avgDaysToPay <= 14 ? 'Na czas' : undefined
  const paidDescription =
    stats.paid.totalCount > 0
      ? `${stats.paid.paidCount} z ${stats.paid.totalCount} rozliczonych${
          stats.paid.avgDaysToPay !== null
            ? ` · śr. ${stats.paid.avgDaysToPay.toFixed(1)} d`
            : ''
        }`
      : 'Brak płatności w tym okresie'

  const outstandingBadge = stats.outstanding.overdueCount > 0 ? 'Po terminie' : 'W terminie'
  const outstandingDescription = `${stats.outstanding.openCount} ${pluralOpen(stats.outstanding.openCount)} · ${stats.outstanding.overdueCount} ${pluralOverdue(stats.outstanding.overdueCount)}`

  const draftsDescription =
    stats.drafts.count > 0
      ? `${stats.drafts.count} ${pluralDraft(stats.drafts.count)} czeka na wysyłkę`
      : 'Brak szkiców'

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <InvoiceStatCard
        label={`WYSTAWIONE · ${stats.monthLabel}`}
        amount={formatCurrency(stats.period.total, currency)}
        secondaryAmount={
          otherCurrencyStats.period.count > 0
            ? formatCurrency(otherCurrencyStats.period.total, otherCurrency)
            : undefined
        }
        badge={formatTrendBadge(stats.period.trendPercent)}
        tone="success"
        description={billedDescription}
      />
      <InvoiceStatCard
        label="OPŁACONE"
        amount={formatCurrency(stats.paid.total, currency)}
        secondaryAmount={
          otherCurrencyStats.paid.paidCount > 0
            ? formatCurrency(otherCurrencyStats.paid.total, otherCurrency)
            : undefined
        }
        badge={paidBadge}
        tone="success"
        description={paidDescription}
      />
      <InvoiceStatCard
        label="OCZEKUJĄCE"
        amount={formatCurrency(stats.outstanding.total, currency)}
        secondaryAmount={
          otherCurrencyStats.outstanding.openCount + otherCurrencyStats.outstanding.overdueCount > 0
            ? formatCurrency(otherCurrencyStats.outstanding.total, otherCurrency)
            : undefined
        }
        badge={outstandingBadge}
        tone={stats.outstanding.overdueCount > 0 ? 'warning' : 'neutral'}
        description={outstandingDescription}
      />
      <InvoiceStatCard
        label="SZKICE"
        amount={formatCurrency(stats.drafts.total, currency)}
        secondaryAmount={
          otherCurrencyStats.drafts.count > 0
            ? formatCurrency(otherCurrencyStats.drafts.total, otherCurrency)
            : undefined
        }
        badge={stats.drafts.count > 0 ? 'Akcja' : undefined}
        tone="action"
        description={draftsDescription}
      />
    </div>
  )
}
