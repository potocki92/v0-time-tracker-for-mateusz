'use client'

import { ArrowDownRight, ArrowUpRight, Clock4, type LucideIcon, Minus, Percent, Sigma } from 'lucide-react'
import type { ReportSummary } from '../lib/types'

type Props = {
  summary:    ReportSummary
  compareOn:  boolean
}

type Trend = {
  direction: 'up' | 'down' | 'flat'
  value:     number
}

function computeTrend(current: number, previous: number): Trend {
  if (previous <= 0) return { direction: 'flat', value: 0 }
  const delta = ((current - previous) / previous) * 100
  if (Math.abs(delta) < 0.5) return { direction: 'flat', value: 0 }
  return { direction: delta > 0 ? 'up' : 'down', value: Math.abs(delta) }
}

function TrendBadge({ trend }: { trend: Trend }) {
  const Icon = trend.direction === 'up'
    ? ArrowUpRight
    : trend.direction === 'down'
      ? ArrowDownRight
      : Minus

  const tone =
    trend.direction === 'up'   ? 'text-emerald-400'
    : trend.direction === 'down' ? 'text-rose-400'
    : 'text-zinc-500'

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${tone}`}>
      <Icon aria-hidden className="size-3" />
      {trend.direction === 'flat' ? 'bez zmian' : `${trend.value.toFixed(1)}%`}
    </span>
  )
}

type CardProps = {
  label:    string
  value:    string
  hint?:    string
  trend?:   Trend
  icon:     LucideIcon
}

function KpiCard({ label, value, hint, trend, icon: Icon }: CardProps) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </p>
        <Icon aria-hidden className="size-4 text-zinc-600" />
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tabular-nums text-white sm:text-[28px]">
        {value}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-zinc-500">
        <span className="truncate">{hint ?? ' '}</span>
        {trend ? <TrendBadge trend={trend} /> : null}
      </div>
    </div>
  )
}

export function ReportsKpis({ summary, compareOn }: Props) {
  const trend = compareOn ? computeTrend(summary.totalHours, summary.prevHours) : undefined

  return (
    <section
      aria-label="Kluczowe wskaźniki"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
    >
      <KpiCard
        label="Łącznie godzin"
        value={`${summary.totalHours.toFixed(1)}h`}
        hint={compareOn ? `Poprzednio: ${summary.prevHours.toFixed(1)}h` : `${summary.workedCount} wpisów`}
        trend={trend}
        icon={Sigma}
      />
      <KpiCard
        label="Średnia / dzień"
        value={`${summary.avgPerActiveDay.toFixed(1)}h`}
        hint="W aktywne dni"
        icon={Clock4}
      />
      <KpiCard
        label="Billable"
        value={`${Math.round(summary.billableRatio)}%`}
        hint="Udział godzin rozliczanych"
        icon={Percent}
      />
    </section>
  )
}
