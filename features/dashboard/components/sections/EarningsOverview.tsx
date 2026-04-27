'use client'

import { memo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import type { EarningsTrendData } from '../../hooks/useEarningsTrend'
import type { SparklinePoint } from '../../hooks/useEarningsSparkline'

type Props = {
  totalPLN: number
  totalEUR: number
  trend: EarningsTrendData
  sparklineData: SparklinePoint[]
  periodLabel?: string
  goalProgress: number
  goalAmount: number
  goalCurrency: 'PLN' | 'EUR'
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.[0]) return null
  const { label, value } = payload[0].payload as SparklinePoint
  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-2.5 py-1.5 text-xs shadow-2xl">
      <p className="font-medium text-white">{label}</p>
      <p className="text-zinc-400">{formatCurrency(value, 'PLN')}</p>
    </div>
  )
}

function CircularGoal({ value }: { value: number }) {
  const size = 76
  const stroke = 7
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, value))
  const offset = circ * (1 - clamped / 100)
  const reached = clamped >= 100

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`Postęp celu: ${clamped.toFixed(0)} procent`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1a1a1a"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#22c55e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          fill="none"
          style={{
            transition: 'stroke-dashoffset 600ms ease',
            filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.55))',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-base font-bold tabular-nums text-white">
          {clamped.toFixed(0)}%
        </span>
        {reached && (
          <span className="text-[9px] font-medium uppercase tracking-wide text-emerald-400">
            done
          </span>
        )}
      </div>
    </div>
  )
}

function getTrendIcon(percent: number | null) {
  if (percent === null || percent === 0) return Minus
  return percent > 0 ? ArrowUpRight : ArrowDownRight
}

export const EarningsOverview = memo(function EarningsOverview({
  totalPLN,
  totalEUR,
  trend,
  sparklineData,
  periodLabel,
  goalProgress,
  goalAmount,
  goalCurrency,
}: Props) {
  const TrendIcon = getTrendIcon(trend.percent)
  const isUp = (trend.percent ?? 0) >= 0
  const trendColor = trend.percent === null
    ? 'text-zinc-400'
    : isUp
      ? 'text-emerald-400'
      : 'text-red-400'
  const trendBg = trend.percent === null
    ? 'bg-zinc-500/10'
    : isUp
      ? 'bg-emerald-500/10'
      : 'bg-red-500/10'
  const hasSparkline = sparklineData.length >= 2
  const hasGoal = goalAmount > 0

  return (
    <section
      aria-label="Przegląd zarobków"
      className="relative overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"
      />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Earnings
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
                {formatCurrency(totalPLN, 'PLN')}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
              {periodLabel && <span>{periodLabel}</span>}
              {totalEUR > 0 && (
                <>
                  <span aria-hidden>•</span>
                  <span>{formatCurrency(totalEUR, 'EUR')}</span>
                </>
              )}
            </div>
            {trend.percent !== null && (
              <span
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${trendBg} ${trendColor}`}
              >
                <TrendIcon className="h-3.5 w-3.5" aria-hidden />
                {trend.percent > 0 ? '+' : ''}
                {trend.percent.toFixed(1)}%
              </span>
            )}
          </div>

          {hasGoal && (
            <div className="flex flex-col items-center gap-1 text-right">
              <CircularGoal value={goalProgress} />
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                of goal
              </p>
              <p className="text-[11px] font-semibold tabular-nums text-zinc-300">
                {formatCurrency(goalAmount, goalCurrency)}
              </p>
            </div>
          )}
        </div>

        {hasSparkline && (
          <div className="mt-4 h-32 w-full sm:h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparklineData}
                margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="60%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#earningsGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: '#22c55e',
                    fill: '#0a0a0a',
                  }}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.35))' }}
                />
                <Tooltip content={<ChartTooltip />} cursor={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  )
})
