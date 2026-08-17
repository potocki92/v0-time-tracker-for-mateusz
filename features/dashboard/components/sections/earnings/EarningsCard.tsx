'use client'

import { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'
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
import { maskValue } from '../../../hooks/useDashboardUiStore'
import type { EarningsTrendData } from '../../../hooks/useEarningsTrend'
import type { SparklinePoint } from '../../../hooks/useEarningsSparkline'
import { EarningsMenu } from './EarningsMenu'
import { buildSeries } from './series'

// recharts osobnym chunkiem — kwota i KPI nie czekają na wykres.
const EarningsSparkChart = dynamic(
  () => import('./EarningsSparkChart').then((mod) => mod.EarningsSparkChart),
  { ssr: false },
)

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
      className="relative overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4"
    >
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
              className="text-[26px] font-semibold tabular-nums leading-[1.15] text-white sm:text-[32px] sm:font-bold sm:leading-tight"
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
      <dl className="relative mt-3.5 grid grid-cols-3 gap-2">
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
        <div className="relative mt-4 h-44 w-full sm:h-48">
          <EarningsSparkChart
            series={series}
            ticks={ticks}
            privacyMode={privacyMode}
            compareMode={compareMode}
          />

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
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] p-2.5">
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
