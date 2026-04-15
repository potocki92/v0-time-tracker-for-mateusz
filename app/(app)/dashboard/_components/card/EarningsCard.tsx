// app/(app)/dashboard/_components/card/EarningsCard.tsx
'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import type { SparklinePoint } from '../../_hooks/useEarningsSparkline'

interface EarningsCardProps {
  /** Suma wszystkich zarobków w PLN (EUR już przeliczone) */
  totalPLN:       number
  /** Tylko zarobki rozliczane pierwotnie w PLN */
  earningsPLN:    number
  /** Tylko zarobki rozliczane pierwotnie w EUR (przed konwersją) */
  earningsEUR:    number
  /** % zmiany vs poprzedni okres — null gdy brak danych porównawczych */
  trend?:         number | null
  /** Dane dzienne do sparkline — min. 2 punkty by coś narysować */
  sparklineData?: SparklinePoint[]
  /** Etykieta okresu pod nagłówkiem (np. "Ten tydzień") */
  periodLabel?:   string
}

// ── Konfiguracja kolorystyczna per kierunek trendu ───────────────────────────
const TREND_CONFIG = {
  up: {
    Icon:       TrendingUp,
    textColor:  'text-emerald-600 dark:text-emerald-400',
    bgColor:    'bg-emerald-500/10',
    ringColor:  'ring-emerald-500/20',
    sparkStop:  '#10b981',
    glowColor:  'rgba(16, 185, 129, 0.18)',
  },
  down: {
    Icon:       TrendingDown,
    textColor:  'text-red-600 dark:text-red-400',
    bgColor:    'bg-red-500/10',
    ringColor:  'ring-red-500/20',
    sparkStop:  '#ef4444',
    glowColor:  'rgba(239, 68, 68, 0.18)',
  },
  neutral: {
    Icon:       Minus,
    textColor:  'text-muted-foreground',
    bgColor:    'bg-muted/30',
    ringColor:  'ring-border',
    sparkStop:  '#94a3b8',
    glowColor:  'rgba(148, 163, 184, 0.12)',
  },
} as const

function resolveTrend(trend: number | null | undefined): keyof typeof TREND_CONFIG {
  if (trend == null) return 'neutral'
  if (trend >   0.1) return 'up'
  if (trend <  -0.1) return 'down'
  return 'neutral'
}

// ── Component ────────────────────────────────────────────────────────────────
function EarningsCardImpl({
  totalPLN,
  earningsPLN,
  earningsEUR,
  trend,
  sparklineData = [],
  periodLabel,
}: EarningsCardProps) {
  const direction = resolveTrend(trend)
  const cfg       = TREND_CONFIG[direction]
  const TrendIcon = cfg.Icon

  const hasTrend     = trend !== null && trend !== undefined
  const hasSparkline = sparklineData.length >= 2

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      {/* ── Decorative animated glow ──────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl transition-colors duration-700"
        style={{ backgroundColor: cfg.glowColor }}
        aria-hidden
      />

      {/* ── Background grid pattern (SVG) ─────────────────────────────────── */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-foreground opacity-[0.025]"
        aria-hidden
      >
        <defs>
          <pattern id="earnings-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#earnings-grid)" />
      </svg>

      {/* ── Header: Wallet icon + title + trend badge ─────────────────────── */}
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/20 shadow-sm">
              <Wallet className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Zarobki
              </span>
              {periodLabel && (
                <span className="text-[10px] text-muted-foreground/70">
                  {periodLabel}
                </span>
              )}
            </div>
          </div>

          {hasTrend && (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ring-1',
                cfg.bgColor,
                cfg.textColor,
                cfg.ringColor,
              )}
              aria-label={`Trend: ${trend!.toFixed(1)} procent`}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden />
              <span className="tabular-nums">
                {trend! > 0 ? '+' : ''}
                {trend!.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {/* ── Main amount ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent tabular-nums">
              {formatCurrency(totalPLN, 'PLN')}
            </span>
          </div>

          {/* Breakdown PLN / EUR */}
          {(earningsPLN > 0 || earningsEUR > 0) && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              {earningsPLN > 0 && (
                <span className="tabular-nums">
                  PLN {formatCurrency(earningsPLN, 'PLN')}
                </span>
              )}
              {earningsPLN > 0 && earningsEUR > 0 && (
                <span className="h-3 w-px bg-border" aria-hidden />
              )}
              {earningsEUR > 0 && (
                <span className="tabular-nums">
                  EUR {formatCurrency(earningsEUR, 'EUR')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Sparkline ───────────────────────────────────────────────────── */}
        {hasSparkline && (
          <div className="-mx-1 h-14" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="sparkline-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor={cfg.sparkStop} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={cfg.sparkStop} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#sparkline-stroke)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: cfg.sparkStop, strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={700}
                />
                <Tooltip
                  cursor={{ stroke: cfg.sparkStop, strokeOpacity: 0.3, strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const point = payload[0]
                    return (
                      <div className="rounded-md border bg-background/95 px-2 py-1 text-xs shadow-sm backdrop-blur">
                        <div className="font-medium">{point.payload.label}</div>
                        <div className="text-muted-foreground tabular-nums">
                          {formatCurrency(Number(point.value), 'PLN')}
                        </div>
                      </div>
                    )
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const EarningsCard = memo(EarningsCardImpl)
