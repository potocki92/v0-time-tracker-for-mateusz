'use client'

import { useState } from 'react'
import { Banknote, Clock } from 'lucide-react'
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/helpers'
import { Client, WorkEntry } from '@/lib/types'
import { ChartGrouping } from '../_domain/dashboard.types'
import { useChartData } from '../_hooks/useChartData'

const chartConfig = {
  earningsPLN: { label: 'Zarobki (PLN)', color: 'var(--primary)' },
  hours: { label: 'Godziny', color: 'var(--chart-2)' },
} satisfies ChartConfig

const formatCompactNumber = (value: number): string =>
  value >= 1000
    ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
    : `${value}`

type Props = {
  workEntries: WorkEntry[]
  clients: Client[]
  eurToPlnRate: number
  dateRange: { from: Date | null; to: Date | null }
}

export function EarningsChart({ workEntries, clients, eurToPlnRate, dateRange }: Props) {
  const [grouping, setGrouping] = useState<ChartGrouping>('daily')

  const chartData = useChartData(workEntries, clients, grouping, eurToPlnRate, dateRange)

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Analiza okresowa</CardTitle>
          <Tabs value={grouping} onValueChange={(v) => setGrouping(v as ChartGrouping)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="px-2 text-xs">Dziennie</TabsTrigger>
              <TabsTrigger value="weekly" className="px-2 text-xs">Tygodniowo</TabsTrigger>
              <TabsTrigger value="monthly" className="px-2 text-xs">Miesięcznie</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Legenda — identyczna jak w bb.tsx */}
        <div className="flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5 text-primary/80" />
            PLN
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[var(--chart-2)]" />
            Godziny
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Brak danych do wyświetlenia
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-80 min-h-[350px]">
            <ComposedChart
              data={chartData}
              margin={{ left: 15, right: 14, top: 10, bottom: 8 }}
            >
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.18} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="var(--border)"
                strokeOpacity={0.35}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickMargin={10}
                tick={{ fontSize: 12 }}
              />

              <YAxis
                yAxisId="earnings"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={54}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => formatCompactNumber(Number(v))}
              />

              <YAxis
                yAxisId="hours"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={44}
                tick={{ fontSize: 12 }}
              />

              <ChartTooltip
                cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.22, strokeDasharray: '4 4' }}
                content={
                  <ChartTooltipContent
                    className="min-w-[220px] border-white/20 bg-background/80 px-3 py-2 shadow-2xl backdrop-blur-md"
                    formatter={(value, _, item) => {
                      if (item.dataKey === 'earningsPLN') {
                        return (
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="text-muted-foreground">Zarobki (PLN)</span>
                            <span className="font-semibold tabular-nums">
                              {formatCurrency(Number(value), 'PLN')}
                            </span>
                          </div>
                        )
                      }
                      if (item.dataKey === 'hours') {
                        return (
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="text-muted-foreground">Godziny</span>
                            <span className="font-semibold tabular-nums">
                              {Number(value).toFixed(1)}h
                            </span>
                          </div>
                        )
                      }
                      return null
                    }}
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as
                        | { label: string; earningsEUR: number }
                        | undefined
                      if (!point) return ''
                      return (
                        <div className="space-y-1 border-b border-border/60 pb-1.5">
                          <p className="font-medium text-foreground">{point.label}</p>
                          {point.earningsEUR > 0 && (
                            <p className="text-right text-[11px] text-muted-foreground">
                              EUR: {formatCurrency(point.earningsEUR, 'EUR')}
                            </p>
                          )}
                        </div>
                      )
                    }}
                  />
                }
              />

              <Area
                yAxisId="earnings"
                type="monotone"
                dataKey="earningsPLN"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#earningsGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }}
              />

              <Bar
                yAxisId="hours"
                dataKey="hours"
                fill="url(#hoursGradient)"
                stroke="var(--chart-2)"
                strokeOpacity={0.35}
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
