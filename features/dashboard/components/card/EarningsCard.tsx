'use client'

import React, { memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import type { EarningsTrendData } from '../../hooks/useEarningsTrend'
import type { SparklinePoint } from '../../hooks/useEarningsSparkline'

// ── Trend configuration ─────────────────────────────────────────────────────

const TREND_CONFIG = {
  up: {
    Icon: TrendingUp,
    Arrow: ArrowUpRight,
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    glow: 'from-emerald-500/20 via-emerald-500/5',
    stroke: '#10b981',
    fill: '#10b981',
    border: 'border-emerald-500/20',
    diffText: 'text-emerald-600 dark:text-emerald-400',
    label: 'więcej',
  },
  down: {
    Icon: TrendingDown,
    Arrow: ArrowDownRight,
    badge: 'bg-red-500/15 text-red-500 dark:text-red-400',
    glow: 'from-red-500/20 via-red-500/5',
    stroke: '#ef4444',
    fill: '#ef4444',
    border: 'border-red-500/20',
    diffText: 'text-red-500 dark:text-red-400',
    label: 'mniej',
  },
  neutral: {
    Icon: Minus,
    Arrow: Minus,
    badge: 'bg-muted text-muted-foreground',
    glow: 'from-primary/10 via-primary/5',
    stroke: '#6b7280',
    fill: '#6b7280',
    border: 'border-primary/20',
    diffText: 'text-muted-foreground',
    label: 'bez zmian',
  },
} as const

type TrendKey = keyof typeof TREND_CONFIG

function getTrendKey(percent: number | null): TrendKey {
  if (percent === null) return 'neutral'
  if (percent > 0) return 'up'
  if (percent < 0) return 'down'
  return 'neutral'
}

// ── Custom sparkline tooltip ─────────────────────────────────────────────────

function SparklineTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.[0]) return null
  const { label, value } = payload[0].payload as SparklinePoint
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{formatCurrency(value, 'PLN')}</p>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  totalPLN: number
  totalEUR: number
  earningsOnlyPLN: number
  trend: EarningsTrendData
  sparklineData?: SparklinePoint[]
  periodLabel?: string
}

// ── Component ────────────────────────────────────────────────────────────────

export const EarningsCard = memo(function EarningsCard({
  totalPLN,
  totalEUR,
  earningsOnlyPLN,
  trend,
  sparklineData = [],
  periodLabel,
}: Props) {
  const trendKey = getTrendKey(trend.percent)
  const cfg = TREND_CONFIG[trendKey]
  const hasTrend = trend.percent !== null
  const hasSparkline = sparklineData.length >= 2

  return (
    <Card className={`relative overflow-hidden ${cfg.border}`}>
      {/* ── Gradient glow ──────────────────────────────────── */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${cfg.glow} to-transparent blur-2xl`}
      />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Left: icon + title */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Wallet className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Zarobki</p>
              {periodLabel && (
                <p className="text-[11px] text-muted-foreground/60">{periodLabel}</p>
              )}
            </div>
          </div>

          {/* Right: trend badge */}
          {hasTrend && (
            <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
              <cfg.Icon className="h-3.5 w-3.5" />
              {trend.percent! > 0 ? '+' : ''}
              {trend.percent!.toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* ── Main amount ──────────────────────────────────── */}
        <div>
          <div className="text-3xl font-bold tracking-tight">
            {formatCurrency(totalPLN, 'PLN')}
          </div>
          {(earningsOnlyPLN > 0 || totalEUR > 0) && (
            <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
              {earningsOnlyPLN > 0 && (
                <span>{formatCurrency(earningsOnlyPLN, 'PLN')}</span>
              )}
              {totalEUR > 0 && (
                <span>{formatCurrency(totalEUR, 'EUR')}</span>
              )}
            </div>
          )}
        </div>

        {/* ── Trend comparison section ─────────────────────── */}
        {hasTrend && trend.prevTotal > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <div className={`flex items-center gap-1 text-sm font-medium ${cfg.diffText}`}>
              <cfg.Arrow className="h-4 w-4" />
              <span>{formatCurrency(Math.abs(trend.diff), 'PLN')}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {cfg.label} niż poprzedni okres
            </span>
          </div>
        )}

        {/* ── Previous period reference ────────────────────── */}
        {trend.prevTotal > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Poprzedni okres</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(trend.prevTotal, 'PLN')}
            </span>
          </div>
        )}

        {/* ── Sparkline ────────────────────────────────────── */}
        {hasSparkline && (
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cfg.fill} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={cfg.fill} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={cfg.stroke}
                  strokeWidth={2}
                  fill="url(#sparkFill)"
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 1.5, fill: 'var(--background)' }}
                />
                <Tooltip
                  content={<SparklineTooltip />}
                  cursor={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
