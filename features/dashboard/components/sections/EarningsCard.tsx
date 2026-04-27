'use client'

import { memo, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipProps,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Eye,
  EyeOff,
  Minus,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/helpers'
import { maskValue } from '../../hooks/useDashboardUiStore'
import type { EarningsTrendData } from '../../hooks/useEarningsTrend'
import type { SparklinePoint } from '../../hooks/useEarningsSparkline'
import { EarningsMenu } from './EarningsMenu'

/* ─────────────────────────── types ─────────────────────────── */

type Props = {
  totalPLN: number
  totalEUR: number
  trend: EarningsTrendData
  sparklineData: SparklinePoint[]
  prevSparklineData?: SparklinePoint[]
  periodLabel: string
  privacyMode: boolean
  compareMode: boolean
  isExporting?: boolean
  onTogglePrivacy: () => void
  onToggleCompare: () => void
  onExportCsv: () => void
  onExportPdf: () => void
  onOpenAnalytics: () => void
  onSetGoal: () => void
  onCopyAmount: () => void
}

type SeriesPoint = {
  date: string
  /** dzień miesiąca jako liczba (1..31) – używany na osi X dla normalizacji */
  day: number
  label: string
  cumulative: number
  forecast: number | null
  /** Skumulowana wartość z poprzedniego okresu zmapowana na ten sam dzień */
  prevCumulative: number | null
}

/* ─────────────────────────── series builder ─────────────────────────── */

function cumulate(points: SparklinePoint[]): { day: number; value: number }[] {
  if (points.length === 0) return []
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  let acc = 0
  return sorted.map((p) => {
    acc += p.value
    return {
      day: new Date(p.date).getDate(),
      value: Math.round(acc * 100) / 100,
    }
  })
}

function buildSeries(
  current: SparklinePoint[],
  previous: SparklinePoint[] | undefined,
): SeriesPoint[] {
  if (current.length === 0) return []

  const sorted = [...current].sort((a, b) => a.date.localeCompare(b.date))
  const prevCumulated = previous ? cumulate(previous) : []
  const prevByDay = new Map(prevCumulated.map((p) => [p.day, p.value]))

  let acc = 0
  const series: SeriesPoint[] = sorted.map((p) => {
    acc += p.value
    const d = new Date(p.date)
    const day = d.getDate()
    return {
      date: p.date,
      day,
      label: d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
      cumulative: Math.round(acc * 100) / 100,
      forecast: null,
      prevCumulative: prevByDay.get(day) ?? null,
    }
  })

  // Prognoza linearna do końca miesiąca (zachowanie zgodne z poprzednią wersją).
  const last = series[series.length - 1]
  const lastDate = new Date(last.date)
  const dayOfMonth = lastDate.getDate()
  const daysInMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0).getDate()

  if (dayOfMonth < daysInMonth) {
    const dailyAvg = last.cumulative / Math.max(1, dayOfMonth)
    const cursor = new Date(lastDate)
    for (let i = 1; i <= daysInMonth - dayOfMonth; i += 1) {
      cursor.setDate(lastDate.getDate() + i)
      const projected = Math.round(dailyAvg * (dayOfMonth + i) * 100) / 100
      const day = cursor.getDate()
      series.push({
        date: cursor.toISOString().slice(0, 10),
        day,
        label: cursor.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
        cumulative: Number.NaN as unknown as number,
        forecast: projected,
        prevCumulative: prevByDay.get(day) ?? null,
      })
    }
  }

  return series
}

/* ─────────────────────────── tooltip ─────────────────────────── */

function makeChartTooltip(privacyMode: boolean, compareMode: boolean) {
  return function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
    if (!active || !payload?.[0]) return null
    const row = payload[0].payload as SeriesPoint
    const value = Number.isFinite(row.cumulative) ? row.cumulative : row.forecast ?? 0
    const isForecast =
      row.forecast !== null && Number.isFinite(row.forecast) && !Number.isFinite(row.cumulative)

    return (
      <div className="rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-2.5 py-1.5 text-xs shadow-2xl">
        <p className="font-medium text-white">{row.label}</p>
        <p className={cn('tabular-nums', isForecast ? 'text-zinc-400' : 'text-emerald-400')}>
          {maskValue(formatCurrency(value, 'PLN'), privacyMode)}
        </p>
        {compareMode && row.prevCumulative !== null && (
          <p className="tabular-nums text-zinc-500">
            Poprz.: {maskValue(formatCurrency(row.prevCumulative, 'PLN'), privacyMode)}
          </p>
        )}
        {isForecast && (
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">prognoza</p>
        )}
      </div>
    )
  }
}

/* ─────────────────────────── helpers ─────────────────────────── */

function getTrendIcon(percent: number | null) {
  if (percent === null || percent === 0) return Minus
  return percent > 0 ? ArrowUpRight : ArrowDownRight
}

type DailyStats = {
  bestDay: { date: string; value: number } | null
  activeDays: number
  averagePerDay: number
}

function computeDailyStats(points: SparklinePoint[]): DailyStats {
  if (points.length === 0) {
    return { bestDay: null, activeDays: 0, averagePerDay: 0 }
  }
  let best: SparklinePoint | null = null
  let active = 0
  let total = 0
  for (const p of points) {
    if (p.value > 0) {
      active += 1
      total += p.value
      if (!best || p.value > best.value) best = p
    }
  }
  return {
    bestDay: best ? { date: best.date, value: best.value } : null,
    activeDays: active,
    averagePerDay: active > 0 ? total / active : 0,
  }
}

function formatBestDayLabel(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })
}

/* ─────────────────────────── card ─────────────────────────── */

export const EarningsCard = memo(function EarningsCard({
  totalPLN,
  totalEUR,
  trend,
  sparklineData,
  prevSparklineData,
  periodLabel,
  privacyMode,
  compareMode,
  isExporting = false,
  onTogglePrivacy,
  onToggleCompare,
  onExportCsv,
  onExportPdf,
  onOpenAnalytics,
  onSetGoal,
  onCopyAmount,
}: Props) {
  const series = useMemo(
    () => buildSeries(sparklineData, compareMode ? prevSparklineData : undefined),
    [sparklineData, prevSparklineData, compareMode],
  )

  const dailyStats = useMemo(() => computeDailyStats(sparklineData), [sparklineData])

  const TrendIcon = getTrendIcon(trend.percent)
  const isUp = (trend.percent ?? 0) >= 0
  const trendColor =
    trend.percent === null
      ? 'text-zinc-400'
      : isUp
        ? 'text-emerald-400'
        : 'text-red-400'
  const trendBg =
    trend.percent === null
      ? 'bg-zinc-500/10 ring-zinc-500/20'
      : isUp
        ? 'bg-emerald-500/10 ring-emerald-500/30'
        : 'bg-red-500/10 ring-red-500/30'

  const hasSeries = series.length >= 2
  const lastForecastPoint = series.findLast?.((s) => s.forecast !== null) ?? null
  const forecastValue = lastForecastPoint?.forecast ?? null
  const diffSign = trend.diff >= 0 ? '+' : '−'
  const diffAbs = Math.abs(trend.diff)
  const showCompareLine = compareMode && trend.prevTotal > 0

  // Tikcs na osi X – maks. 6 wartości równo rozstawionych.
  const ticks = useMemo(() => {
    if (series.length < 2) return []
    const count = Math.min(6, series.length)
    const step = (series.length - 1) / (count - 1)
    return Array.from({ length: count }, (_, i) => series[Math.round(i * step)].date)
  }, [series])

  const totalPLNStr = maskValue(formatCurrency(totalPLN, 'PLN'), privacyMode)
  const totalEURStr = maskValue(formatCurrency(totalEUR, 'EUR'), privacyMode)
  const avgStr = maskValue(formatCurrency(dailyStats.averagePerDay, 'PLN'), privacyMode)
  const bestStr = dailyStats.bestDay
    ? maskValue(formatCurrency(dailyStats.bestDay.value, 'PLN'), privacyMode)
    : '—'

  return (
    <section
      aria-label="Zarobki"
      className="relative overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
      />

      {/* ─────────────── HEADER ─────────────── */}
      <header className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Zarobki · {periodLabel}
            </p>
            {trend.percent !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 tabular-nums',
                  trendBg,
                  trendColor,
                )}
              >
                <TrendIcon className="h-3 w-3" aria-hidden />
                {trend.percent > 0 ? '+' : ''}
                {trend.percent.toFixed(1)}%
              </span>
            )}
            {privacyMode && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#161616] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400 ring-1 ring-[#1f1f1f]">
                <EyeOff className="h-3 w-3" aria-hidden />
                privacy
              </span>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="text-[26px] font-semibold tracking-tight tabular-nums leading-[1.15] text-white sm:text-[34px] sm:font-bold sm:leading-tight md:text-4xl"
              aria-label={privacyMode ? 'Kwota ukryta' : undefined}
            >
              {totalPLNStr}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.4] text-zinc-500 tabular-nums">
            ≈ {totalEURStr}
          </p>

          <p className="mt-1 text-[11.5px] leading-[1.4] text-zinc-500 sm:text-xs">
            {showCompareLine && (
              <>
                <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>
                  {diffSign}
                  {maskValue(formatCurrency(diffAbs, 'PLN'), privacyMode)}
                </span>{' '}
                {isUp ? 'powyżej' : 'poniżej'} poprzedniego okresu
              </>
            )}
            {forecastValue !== null && (
              <>
                {showCompareLine && <span className="mx-1">·</span>}
                <span>
                  Prognoza{' '}
                  {maskValue(formatCurrency(forecastValue, 'PLN'), privacyMode)}
                </span>
              </>
            )}
          </p>
        </div>

        <EarningsMenu
          privacyMode={privacyMode}
          compareMode={compareMode}
          onTogglePrivacy={onTogglePrivacy}
          onToggleCompare={onToggleCompare}
          onExportCsv={onExportCsv}
          onExportPdf={onExportPdf}
          onOpenAnalytics={onOpenAnalytics}
          onSetGoal={onSetGoal}
          onCopyAmount={onCopyAmount}
          isExporting={isExporting}
        />
      </header>

      {/* ─────────────── KPI strip ─────────────── */}
      <dl className="relative mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <KpiTile
          icon={TrendingUp}
          label="Średnia / dzień pracy"
          value={avgStr}
        />
        <KpiTile
          icon={CalendarDays}
          label="Aktywne dni"
          value={String(dailyStats.activeDays)}
        />
        <KpiTile
          icon={Sparkles}
          label="Najlepszy dzień"
          value={bestStr}
          hint={formatBestDayLabel(dailyStats.bestDay?.date ?? null)}
        />
      </dl>

      {/* ─────────────── chart ─────────────── */}
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
                <linearGradient id="earningsPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#71717a" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
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
              <Tooltip
                content={makeChartTooltip(privacyMode, compareMode)}
                cursor={{ stroke: '#22c55e', strokeOpacity: 0.3 }}
              />

              {/* Poprzedni okres jako tło — tylko gdy włączony tryb compare */}
              {compareMode && (
                <Area
                  type="monotone"
                  dataKey="prevCumulative"
                  stroke="#71717a"
                  strokeOpacity={0.55}
                  strokeWidth={1.25}
                  strokeDasharray="2 3"
                  fill="url(#earningsPrev)"
                  fillOpacity={0.6}
                  dot={false}
                  activeDot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              )}

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
                isAnimationActive={false}
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
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legenda compare — tylko gdy aktywny tryb i jest co pokazać */}
          {compareMode && trend.prevTotal > 0 && (
            <div className="pointer-events-none absolute right-2 top-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-[2px] w-3 rounded-full bg-emerald-400" aria-hidden />
                bieżący
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  aria-hidden
                  className="h-[2px] w-3 rounded-full bg-zinc-500"
                  style={{ background: 'repeating-linear-gradient(90deg,#71717a 0 3px,transparent 3px 6px)' }}
                />
                poprzedni
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
})

/* ─────────────────────────── KPI tile ─────────────────────────── */

function KpiTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-2.5 sm:p-3">
      <div className="flex items-center justify-between text-zinc-500">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#161616] text-zinc-300 ring-1 ring-[#1f1f1f]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {hint && <span className="text-[10px] font-medium uppercase tracking-wide">{hint}</span>}
      </div>
      <p className="mt-2 text-[14px] font-semibold tabular-nums leading-[1.15] text-white sm:text-[15px]">
        {value}
      </p>
      <p className="text-[10.5px] text-zinc-500 sm:text-[11px]">{label}</p>
    </div>
  )
}
