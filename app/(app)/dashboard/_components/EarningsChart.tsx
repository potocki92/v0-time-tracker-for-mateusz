'use client'

import { useState, useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { formatCurrency, calculateEarnings } from '@/lib/helpers'
import { Client, WorkEntry } from '@/lib/types'
import { useChartData } from '../_hooks/useChartData'

// ── types ─────────────────────────────────────────────────────────────────────

type Grouping = 'daily' | 'weekly' | 'monthly'
type Period = 'week' | 'month' | 'year'
type DateRange = { from: Date | null; to: Date | null }

const PERIOD_OPTIONS: Record<Grouping, { value: Period; label: string }[]> = {
  daily:   [{ value: 'week', label: 'Tydzień' }, { value: 'month', label: 'Miesiąc' }, { value: 'year', label: 'Rok' }],
  weekly:  [{ value: 'month', label: 'Miesiąc' }, { value: 'year', label: 'Rok' }],
  monthly: [{ value: 'year', label: 'Rok' }],
}

const DEFAULT_PERIOD: Record<Grouping, Period> = {
  daily: 'week', weekly: 'month', monthly: 'year',
}

// ── date helpers ──────────────────────────────────────────────────────────────

function getRangeFromPeriod(period: Period): DateRange {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (period === 'week') {
    const day = now.getDay()
    const offset = day === 0 ? -6 : 1 - day
    const from = new Date(now)
    from.setDate(now.getDate() + offset)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(from.getDate() + 6)
    return { from, to }
  }
  if (period === 'month') return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) }
  return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) }
}

function getPrevRange(r: DateRange): DateRange {
  if (!r.from || !r.to) return { from: null, to: null }
  const duration = r.to.getTime() - r.from.getTime()
  return {
    from: new Date(r.from.getTime() - duration - 86_400_000),
    to: new Date(r.from.getTime() - 86_400_000),
  }
}

// ── tooltip ───────────────────────────────────────────────────────────────────

type BarPayload = {
  label: string
  hours: number
  earningsPLN: number
  earningsEUR: number
  prevHours?: number
}

function BarTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: BarPayload }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d.hours && !d.earningsPLN) return null

  return (
    <div className="rounded-lg border border-border/50 bg-background/95 px-2.5 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-[10px] font-medium text-muted-foreground">{d.label}</p>
      <p className="text-xs font-bold tabular-nums">{d.hours.toFixed(1)}h</p>
      {d.earningsEUR > 0 ? (
        <p className="mt-0.5 text-[11px] tabular-nums">
          <span className="font-semibold">{formatCurrency(d.earningsEUR, 'EUR')}</span>
          <span className="ml-1.5 text-[10px] text-muted-foreground">
            {formatCurrency(d.earningsPLN, 'PLN')}
          </span>
        </p>
      ) : d.earningsPLN > 0 ? (
        <p className="mt-0.5 text-[11px] font-semibold tabular-nums">
          {formatCurrency(d.earningsPLN, 'PLN')}
        </p>
      ) : null}
      {(d.prevHours ?? 0) > 0 && (
        <p className="mt-1 border-t border-border/40 pt-1 text-[10px] text-muted-foreground">
          Poprzednio: {d.prevHours!.toFixed(1)}h
        </p>
      )}
    </div>
  )
}

// ── chart config ──────────────────────────────────────────────────────────────

const chartConfig = {
  hours: { label: 'Godziny', color: 'var(--chart-1)' },
} satisfies ChartConfig

// ── props ─────────────────────────────────────────────────────────────────────

type Props = {
  workEntries: WorkEntry[]
  clients: Client[]
  eurToPlnRate: number
}

// ── component ─────────────────────────────────────────────────────────────────

export function EarningsChart({ workEntries, clients, eurToPlnRate }: Props) {
  const [grouping, setGrouping] = useState<Grouping>('daily')
  const [period, setPeriod] = useState<Period>('week')

  const isYearDaily = grouping === 'daily' && period === 'year'

  function handleGroupingChange(g: Grouping) {
    setGrouping(g)
    setPeriod(DEFAULT_PERIOD[g])
  }

  const dateRange = useMemo(() => getRangeFromPeriod(period), [period])
  const prevRange = useMemo(() => getPrevRange(dateRange), [dateRange])

  const filteredEntries = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return workEntries
    return workEntries.filter((e) => {
      const d = new Date(e.date)
      return d >= dateRange.from! && d <= dateRange.to!
    })
  }, [workEntries, dateRange])

  const prevEntries = useMemo(() => {
    if (!prevRange.from || !prevRange.to) return []
    return workEntries.filter((e) => {
      const d = new Date(e.date)
      return d >= prevRange.from! && d <= prevRange.to!
    })
  }, [workEntries, prevRange])

  const barData     = useChartData(filteredEntries, clients, grouping, eurToPlnRate, dateRange)
  const prevBarData = useChartData(prevEntries, clients, grouping, eurToPlnRate, prevRange)

  const mergedData = useMemo(() =>
    barData.map((d, i) => ({ ...d, prevHours: prevBarData[i]?.hours ?? 0 })),
    [barData, prevBarData]
  )

  const totalHours = useMemo(
    () => filteredEntries.reduce((s, e) => s + (e.hours ?? 0), 0),
    [filteredEntries]
  )

  const totalEarnings = useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    let pln = 0, eur = 0
    for (const entry of filteredEntries) {
      const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
      const e = calculateEarnings(entry, client, eurToPlnRate)
      pln += e.amountInPLN
      if (e.currency === 'EUR') eur += e.amount
    }
    return { pln, eur }
  }, [filteredEntries, clients, eurToPlnRate])

  const avgHours = useMemo(() => {
    const active = mergedData.filter((d) => d.hours > 0)
    if (!active.length) return 0
    return active.reduce((s, d) => s + d.hours, 0) / active.length
  }, [mergedData])

  const trend = useMemo(() => {
    const curr = filteredEntries.reduce((s, e) => s + (e.hours ?? 0), 0)
    const prev = prevEntries.reduce((s, e) => s + (e.hours ?? 0), 0)
    if (!prev) return null
    return ((curr - prev) / prev) * 100
  }, [filteredEntries, prevEntries])

  const isEmpty = mergedData.every((d) => d.hours === 0)

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">Analiza aktywności</CardTitle>
          {trend !== null && (
            <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              trend > 0 ? 'bg-[var(--chart-1)]/10 text-[var(--chart-1)]'
              : trend < 0 ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground'
            }`}>
              {trend > 0
                ? <TrendingUp className="h-2.5 w-2.5" />
                : trend < 0
                ? <TrendingDown className="h-2.5 w-2.5" />
                : <Minus className="h-2.5 w-2.5" />}
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          )}
        </div>

        <CardDescription className="tabular-nums">
          <span>{totalHours.toFixed(1)}h łącznie</span>
          <span className="mx-1.5 text-border">·</span>
          <span className="font-medium text-foreground">
            {formatCurrency(totalEarnings.pln, 'PLN')}
          </span>
          {totalEarnings.eur > 0 && (
            <span className="ml-1 text-[11px] text-muted-foreground">
              ({formatCurrency(totalEarnings.eur, 'EUR')})
            </span>
          )}
        </CardDescription>

        {/* Grouping tabs */}
        <Tabs
          value={grouping}
          onValueChange={(v) => handleGroupingChange(v as Grouping)}
          className="mt-2"
        >
          <TabsList className="h-7 w-full">
            <TabsTrigger value="daily"   className="flex-1 text-[11px]">Dziennie</TabsTrigger>
            <TabsTrigger value="weekly"  className="flex-1 text-[11px]">Tygodniowo</TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 text-[11px]">Miesięcznie</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period sub-tabs */}
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as Period)}
          className="mt-1.5"
        >
          <TabsList className="h-6 w-full bg-muted/40">
            {PERIOD_OPTIONS[grouping].map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                className="flex-1 text-[10px]"
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="px-1 pb-3 sm:px-3">
        {isEmpty ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            Brak danych
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart
              data={mergedData}
              margin={{ top: 12, right: 4, left: 0, bottom: 0 }}
              barCategoryGap={isYearDaily ? '15%' : '30%'}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.4}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                minTickGap={isYearDaily ? 40 : 18}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickFormatter={(v) => `${v}h`}
              />
              {avgHours > 0 && (
                <ReferenceLine
                  y={avgHours}
                  stroke="var(--chart-3)"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{
                    value: `śr. ${avgHours.toFixed(1)}h`,
                    position: 'insideTopRight',
                    fontSize: 9,
                    fill: 'var(--chart-3)',
                    dy: -4,
                  }}
                />
              )}
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.4, radius: 4 }}
                content={<BarTooltip />}
              />
              <Bar dataKey="hours" radius={isYearDaily ? [2, 2, 0, 0] : [4, 4, 1, 1]}>
                {mergedData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.hours > 0 ? 'var(--chart-1)' : 'var(--border)'}
                    fillOpacity={entry.hours > 0 ? 0.85 : 0.2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
