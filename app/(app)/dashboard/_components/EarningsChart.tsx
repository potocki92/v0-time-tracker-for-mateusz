'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { calculateEarnings } from '@/lib/helpers'
import { MONTH_NAMES, type Client, type WorkEntry } from '@/lib/types'

// --- DEDYKOWANE HELPERY DAT Z BB.TSX ---
function getWeekStart(date: Date): Date {
  const clone = new Date(date)
  const day = clone.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  clone.setDate(clone.getDate() + mondayOffset)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function getWeekLabel(date: Date): string {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return `${weekStart.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}–${weekEnd.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}`
}

const chartConfig = {
  earningsPLN: {
    label: 'Zarobki (PLN)',
    color: 'hsl(var(--primary))',
  },
  hours: {
    label: 'Godziny',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig

type Props = {
  workEntries: WorkEntry[]
  clients: Client[]
  eurToPlnRate: number
  dateRange: { from: Date | null; to: Date | null }
}

const formatCompactNumber = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` 
  }
  return `${value}`
}

export function EarningsChart({ workEntries, clients, eurToPlnRate, dateRange }: Props) {
  const [grouping, setGrouping] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const chartData = useMemo(() => {
    if (!workEntries.length || !dateRange.from || !dateRange.to) return []

    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const grouped = new Map<string, { label: string; earningsPLN: number; hours: number; sortDate: Date }>()

    // Inicjalizacja osi czasu (identyczna logika co w bb.tsx)
    const cursor = new Date(dateRange.from)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.to)
    end.setHours(0, 0, 0, 0)

    while (cursor <= end) {
      let key = ''
      let label = ''
      let sortDate = new Date(cursor)

      if (grouping === 'daily') {
        key = cursor.toISOString().slice(0, 10)
        label = cursor.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
        cursor.setDate(cursor.getDate() + 1)
      } else if (grouping === 'weekly') {
        const ws = getWeekStart(cursor)
        key = ws.toISOString().slice(0, 10)
        label = getWeekLabel(ws)
        sortDate = ws
        cursor.setDate(cursor.getDate() + 7)
      } else {
        const ms = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
        key = `${ms.getFullYear()}-${ms.getMonth()}`
        label = `${MONTH_NAMES[ms.getMonth()].slice(0, 3)} ${ms.getFullYear()}`
        sortDate = ms
        cursor.setMonth(cursor.getMonth() + 1, 1)
      }

      if (!grouped.has(key)) {
        grouped.set(key, { label, earningsPLN: 0, hours: 0, sortDate })
      }
    }

    // Mapowanie wpisów
    workEntries.forEach((entry) => {
      const entryDate = new Date(entry.date)
      let key = ''

      if (grouping === 'daily') {
        key = entryDate.toISOString().slice(0, 10)
      } else if (grouping === 'weekly') {
        key = getWeekStart(entryDate).toISOString().slice(0, 10)
      } else {
        key = `${entryDate.getFullYear()}-${entryDate.getMonth()}`
      }

      const bucket = grouped.get(key)
      if (bucket) {
        if (entry.status === 'worked') {
          bucket.hours += entry.hours || 0
        }
        const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
        const earnings = calculateEarnings(entry, client, eurToPlnRate)
        bucket.earningsPLN += earnings.amountInPLN
      }
    })

    return Array.from(grouped.values())
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map(b => ({
        label: b.label,
        earningsPLN: Math.round(b.earningsPLN),
        hours: Number(b.hours.toFixed(1))
      }))
  }, [workEntries, clients, grouping, eurToPlnRate, dateRange])

  return (
    <Card>
      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Analiza okresowa</CardTitle>
          <Tabs value={grouping} onValueChange={(v: any) => setGrouping(v)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="px-2 text-xs">Dziennie</TabsTrigger>
              <TabsTrigger value="weekly" className="px-2 text-xs">Tygodniowo</TabsTrigger>
              <TabsTrigger value="monthly" className="px-2 text-xs">Miesięcznie</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 min-h-[350px] w-full">
          <ComposedChart data={chartData} margin={{ top: 20, right: 15, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id='earingsGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='var(--primary)' stopOpacity={0.4} />
                <stop offset='100%' stopColor='var(--primary)' stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={20}
              tick={{ fontSize: 11 }}
              className="uppercase tracking-wider text-muted-foreground"
            />
            <YAxis
              yAxisId="earnings"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={45}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => formatCompactNumber(value)}
            />
            <YAxis
              yAxisId="hours"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              className="text-[10px] text-muted-foreground"
              tickFormatter={(value) => `${value}h`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              yAxisId="earnings"
              type="monotone"
              dataKey="earningsPLN"
              fill="url(#earningsGradient)"
              fillOpacity={1}
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
            />
            <Bar
              yAxisId="hours"
              dataKey="hours"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.3}
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
