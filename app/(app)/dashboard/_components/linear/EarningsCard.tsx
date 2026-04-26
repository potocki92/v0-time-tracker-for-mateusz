'use client'

import { memo, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipProps,
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Minus, MoreHorizontal } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import type { EarningsTrendData } from '../../_hooks/useEarningsTrend'
import type { SparklinePoint } from '../../_hooks/useEarningsSparkline'

type Props = {
  totalPLN: number
  totalEUR: number
  trend: EarningsTrendData
  sparklineData: SparklinePoint[]
  periodLabel: string
}

type SeriesPoint = {
  date: string
  label: string
  short: string
  cumulative: number
  forecast: number | null
}

function buildSeries(points: SparklinePoint[]): SeriesPoint[] {
  if (points.length === 0) return []
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  let acc = 0
  const series: SeriesPoint[] = sorted.map((p) => {
    acc += p.value
    const d = new Date(p.date)
    return {
      date: p.date,
      label: d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
      short: d.toLocaleDateString('pl-PL', { month: 'short', day: '2-digit' }),
      cumulative: Math.round(acc * 100) / 100,
      forecast: null,
    }
  })

  const last = series[series.length - 1]
  const lastDate = new Date(last.date)
  const dayOfMonth = lastDate.getDate()
  const daysInMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0).getDate()
  if (dayOfMonth >= daysInMonth) return series

  const dailyAvg = last.cumulative / Math.max(1, dayOfMonth)
  const cursor = new Date(lastDate)
  for (let i = 1; i <= daysInMonth - dayOfMonth; i += 1) {
    cursor.setDate(lastDate.getDate() + i)
    const projected = Math.round(dailyAvg * (dayOfMonth + i) * 100) / 100
    const iso = cursor.toISOString().slice(0, 10)
    series.push({
      date: iso,
      label: cursor.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
      short: cursor.toLocaleDateString('pl-PL', { month: 'short', day: '2-digit' }),
      cumulative: Number.NaN as unknown as number,
      forecast: projected,
    })
  }
  return series
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload as SeriesPoint
  const value = Number.isFinite(row.cumulative) ? row.cumulative : row.forecast ?? 0
  return (
    <div className="rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-2.5 py-1.5 text-xs shadow-2xl">
      <p className="font-medium text-white">{row.label}</p>
      <p className="text-zinc-400">{formatCurrency(value, 'PLN')}</p>
      {row.forecast !== null && Number.isFinite(row.forecast) && !Number.isFinite(row.cumulative) && (
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">prognoza</p>
      )}
    </div>
  )
}

function getTrendIcon(percent: number | null) {
  if (percent === null || percent === 0) return Minus
  return percent > 0 ? ArrowUpRight : ArrowDownRight
}

export const EarningsCard = memo(function EarningsCard({
  totalPLN,
  totalEUR,
  trend,
  sparklineData,
  periodLabel,
}: Props) {
  const series = useMemo(() => buildSeries(sparklineData), [sparklineData])
  const TrendIcon = getTrendIcon(trend.percent)
  const isUp = (trend.percent ?? 0) >= 0
  const trendColor = trend.percent === null
    ? 'text-zinc-400'
    : isUp
      ? 'text-emerald-400'
      : 'text-red-400'
  const trendBg = trend.percent === null
    ? 'bg-zinc-500/10 ring-zinc-500/20'
    : isUp
      ? 'bg-emerald-500/10 ring-emerald-500/30'
      : 'bg-red-500/10 ring-red-500/30'

  const hasSeries = series.length >= 2
  const lastForecastPoint = series.findLast?.((s) => s.forecast !== null) ?? null
  const forecastValue = lastForecastPoint?.forecast ?? null
  const diffSign = trend.diff >= 0 ? '+' : '−'
  const diffAbs = Math.abs(trend.diff)

  const ticks = useMemo(() => {
    if (series.length < 2) return []
    const count = Math.min(6, series.length)
    const step = (series.length - 1) / (count - 1)
    return Array.from({ length: count }, (_, i) => series[Math.round(i * step)].date)
  }, [series])

  return (
    <section
      aria-label="Zarobki"
      className="relative overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
      />

      <header className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Zarobki · {periodLabel}
            </p>
            {trend.percent !== null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${trendBg} ${trendColor}`}
              >
                <TrendIcon className="h-3 w-3" aria-hidden />
                {trend.percent > 0 ? '+' : ''}
                {trend.percent.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[26px] font-semibold tracking-tight tabular-nums leading-[1.15] text-white sm:text-[34px] sm:font-bold sm:leading-tight md:text-4xl">
              {formatCurrency(totalPLN, 'PLN')}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.4] text-gray-500 tabular-nums">
            ≈ {formatCurrency(totalEUR, 'EUR')}
          </p>
          <p className="mt-1 text-[11.5px] leading-[1.4] text-zinc-500 sm:text-xs">
            {trend.prevTotal > 0 && (
              <>
                <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>
                  {diffSign}
                  {formatCurrency(diffAbs, 'PLN')}
                </span>
                {' '}
                {isUp ? 'powyżej' : 'poniżej'} poprzedniego okresu
              </>
            )}
            {forecastValue !== null && (
              <>
                {trend.prevTotal > 0 && <span className="mx-1">·</span>}
                <span>Prognoza {formatCurrency(forecastValue, 'PLN')}</span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          aria-label="Opcje zarobków"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-400 transition hover:bg-[#141414] hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </header>

      {hasSeries && (
        <div className="relative mt-4 h-48 w-full sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.55} />
                  <stop offset="55%" stopColor="#22c55e" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#161616" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={ticks}
                tickFormatter={(iso: string) => {
                  const d = new Date(iso)
                  return d.toLocaleDateString('pl-PL', { month: 'short', day: '2-digit' })
                }}
                stroke="#3f3f46"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#71717a', fontSize: 10 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#22c55e', strokeOpacity: 0.3 }} />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#22c55e"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                strokeDasharray="3 4"
                fill="url(#earningsFill)"
                fillOpacity={0.25}
                dot={false}
                activeDot={false}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#22c55e"
                strokeWidth={2.5}
                fill="url(#earningsFill)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#22c55e', fill: '#0a0a0a' }}
                style={{ filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.45))' }}
              />
              <ReferenceLine y={0} stroke="#1f1f1f" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
})
