'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFormat } from '@/lib/format/client'
import type { CURRENCY } from '@/lib/types'
import { axisTickInterval, type ReportTrend } from '../../domain'
import { formatAxisValue, formatMetricValue, toChartPoints, type TrendMetric } from './trendView'

type Props = {
  trend: ReportTrend
  metric: TrendMetric
  currency: CURRENCY
  compare: boolean
  /** Opis wykresu dla czytnika ekranu — wykres jest `role="img"`. */
  description: string
}

/**
 * Wykres trendu.
 *
 * Domyslnie ladowany LENIWIE (patrz `ReportsTrendSection`): Recharts wazy
 * wiecej niz cala reszta raportu razem, a wykres nie jest above-the-fold.
 *
 * Biezacy okres to slupki, poprzedni — przerywana linia. Dwa rodzaje znaku
 * zamiast dwoch kolorow slupkow: na telefonie sasiadujace slupki tej samej
 * szerokosci zlewaly sie w jeden.
 */
export function ReportsTrendChart({ trend, metric, currency, compare, description }: Props) {
  const t = useTranslations('reports')
  const fmt = useFormat()

  const points = useMemo(() => toChartPoints(trend, metric, fmt), [trend, metric, fmt])
  // Na waskim ekranie miesci sie ~6 etykiet; szerokie ekrany i tak nie potrzebuja
  // wiecej niz kilkanascie, zeby os byla czytelna.
  const interval = axisTickInterval(points.length, 12)

  return (
    <div className="mt-4 h-56 w-full sm:h-64" role="img" aria-label={description}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--hairline)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={interval}
            minTickGap={8}
            tick={{ fontSize: 10, fill: 'var(--color-zinc-500)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fontSize: 10, fill: 'var(--color-zinc-500)' }}
            tickFormatter={(value: number) => formatAxisValue(fmt, metric, value, currency)}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-3)' }}
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-zinc-400)', marginBottom: 4 }}
            labelFormatter={(_label: string, payload) =>
              payload?.[0]?.payload?.rangeLabel ?? ''
            }
            formatter={(value: number, name: string) => [
              formatMetricValue(fmt, metric, value, currency),
              name,
            ]}
          />
          <Bar
            dataKey="current"
            name={t('trend.currentSeries')}
            fill="var(--brand-500)"
            radius={[4, 4, 2, 2]}
            maxBarSize={36}
            isAnimationActive={false}
          />
          {compare && (
            <Line
              dataKey="previous"
              name={t('trend.previousSeries')}
              type="monotone"
              stroke="var(--color-zinc-400)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
