'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/helpers'
import { maskValue } from '../../../hooks/useDashboardUiStore'
import type { SeriesPoint } from './series'

/**
 * Sam wykres karty zarobków — wydzielony z `EarningsCard`, żeby recharts
 * (najcięższa zależność dashboardu) ładował się osobnym chunkiem. Kwota
 * i KPI renderują się od razu, wykres dojeżdża chwilę później.
 */

function makeChartTooltip(privacyMode: boolean, compareMode: boolean) {
  return function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
    if (!active || !payload?.[0]) return null
    const row = payload[0].payload as SeriesPoint
    const value = Number.isFinite(row.cumulative) ? row.cumulative : row.forecast ?? 0
    const isForecast =
      row.forecast !== null && Number.isFinite(row.forecast) && !Number.isFinite(row.cumulative)

    return (
      <div className="rounded-lg border border-hairline bg-surface-1 px-2.5 py-1.5 text-xs shadow-2xl">
        <p className="font-medium text-white">{row.label}</p>
        <p className={cn('tabular-nums', isForecast ? 'text-zinc-400' : 'text-emerald-400')}>
          {maskValue(formatCurrency(value, 'PLN'), privacyMode)}
        </p>
        {compareMode && row.prevCumulative !== null && (
          <p className="tabular-nums text-zinc-400">
            Poprz.: {maskValue(formatCurrency(row.prevCumulative, 'PLN'), privacyMode)}
          </p>
        )}
        {isForecast && (
          <p className="text-2xs uppercase tracking-wide text-zinc-400">prognoza</p>
        )}
      </div>
    )
  }
}

type Props = {
  series: SeriesPoint[]
  ticks: string[]
  privacyMode: boolean
  compareMode: boolean
}

export function EarningsSparkChart({ series, ticks, privacyMode, compareMode }: Props) {
  return (
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
  )
}
