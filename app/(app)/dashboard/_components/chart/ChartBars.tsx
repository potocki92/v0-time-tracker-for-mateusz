import {
  Bar,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo } from 'react'
import { ChartContainer, ChartTooltip as ShadTooltip, type ChartConfig } from '@/components/ui/chart'
import { ChartTooltip } from './ChartTooltip'

const chartConfig = {
  hours: { label: 'Godziny', color: 'var(--chart-1)' },
  rolling: { label: 'Trend (7)', color: 'var(--chart-2)' },
} satisfies ChartConfig

type DataItem = {
  label: string
  date: string
  hours: number
  earningsPLN: number
  earningsEUR: number
  prevHours: number
}

type Props = {
  data: DataItem[]
  avgHours: number
  isYearDaily: boolean
}

/**
 * Dorzuca do każdego punktu `rolling` — średnią z 7 poprzednich pozycji
 * (włącznie z bieżącą). Dla krótkich serii (<4) zwraca `undefined`,
 * żeby Recharts nie rysował linii od pierwszego punktu.
 */
function withRollingAverage(data: DataItem[]) {
  const WINDOW = 7
  return data.map((d, i) => {
    if (i < WINDOW - 1) return { ...d, rolling: undefined as number | undefined }
    let sum = 0
    for (let j = i - WINDOW + 1; j <= i; j++) sum += data[j].hours
    return { ...d, rolling: Number((sum / WINDOW).toFixed(1)) }
  })
}

export function ChartBars({ data, avgHours, isYearDaily }: Props) {
  const enriched = useMemo(() => withRollingAverage(data), [data])
  const showRolling = data.length >= 7
  const showBrush = data.length > 14

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <ComposedChart
        data={enriched}
        margin={{ top: 12, right: 4, left: 0, bottom: 0 }}
        barCategoryGap={isYearDaily ? '15%' : '30%'}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} strokeDasharray="3 3" />
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
        <ShadTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.4, radius: 4 }}
          content={<ChartTooltip />}
        />
        <Bar dataKey="hours" radius={isYearDaily ? [2, 2, 0, 0] : [4, 4, 1, 1]}>
          {enriched.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.hours > 0 ? 'var(--chart-1)' : 'var(--border)'}
              fillOpacity={entry.hours > 0 ? 0.85 : 0.2}
            />
          ))}
        </Bar>
        {showRolling && (
          <Line
            type="monotone"
            dataKey="rolling"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1, fill: 'var(--background)' }}
            isAnimationActive={false}
          />
        )}
        {showBrush && (
          <Brush
            dataKey="label"
            height={18}
            travellerWidth={8}
            stroke="var(--border)"
            fill="var(--muted)"
            className="text-[10px]"
          />
        )}
      </ComposedChart>
    </ChartContainer>
  )
}
