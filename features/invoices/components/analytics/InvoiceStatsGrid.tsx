'use client'

import type { CURRENCY } from '@/lib/types'
import { formatMoney, formatNumber, toMinor } from '@/lib/format'
import { StatTile } from '@/components/common/stat/StatTile'
import type { InvoicesAggregateStats } from '../../domain/stats'

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
            ? ` · śr. ${formatNumber(stats.paid.avgDaysToPay, { decimals: 1 })} d`
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
      <StatTile
        label={`WYSTAWIONE · ${stats.monthLabel}`}
        value={formatMoney(toMinor(stats.period.total), currency)}
        secondary={
          otherCurrencyStats.period.count > 0
            ? formatMoney(toMinor(otherCurrencyStats.period.total), otherCurrency)
            : undefined
        }
        badge={formatTrendBadge(stats.period.trendPercent)}
        tone="success"
        meta={billedDescription}
      />
      <StatTile
        label="OPŁACONE"
        value={formatMoney(toMinor(stats.paid.total), currency)}
        secondary={
          otherCurrencyStats.paid.paidCount > 0
            ? formatMoney(toMinor(otherCurrencyStats.paid.total), otherCurrency)
            : undefined
        }
        badge={paidBadge}
        tone="success"
        meta={paidDescription}
      />
      <StatTile
        label="OCZEKUJĄCE"
        value={formatMoney(toMinor(stats.outstanding.total), currency)}
        secondary={
          otherCurrencyStats.outstanding.openCount + otherCurrencyStats.outstanding.overdueCount > 0
            ? formatMoney(toMinor(otherCurrencyStats.outstanding.total), otherCurrency)
            : undefined
        }
        badge={outstandingBadge}
        tone={stats.outstanding.overdueCount > 0 ? 'warning' : 'neutral'}
        meta={outstandingDescription}
      />
      <StatTile
        label="SZKICE"
        value={formatMoney(toMinor(stats.drafts.total), currency)}
        secondary={
          otherCurrencyStats.drafts.count > 0
            ? formatMoney(toMinor(otherCurrencyStats.drafts.total), otherCurrency)
            : undefined
        }
        badge={stats.drafts.count > 0 ? 'Akcja' : undefined}
        tone="action"
        meta={draftsDescription}
      />
    </div>
  )
}
