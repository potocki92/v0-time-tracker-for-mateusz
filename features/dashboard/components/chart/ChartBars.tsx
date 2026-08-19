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
  hours: { label: 'Godziny', color: 'oklch(0.74 0.17 253)' },
  rolling: { label: 'Trend (7)', color: 'oklch(0.78 0.14 159)' },
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
    <div className="rounded-lg border border-white/10 bg-linear-to-b from-white/10 via-white/[0.03] to-transparent p-2 shadow-lg backdrop-blur-sm">
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <ComposedChart data={enriched} margin={{ top: 14, right: 8, left: -2, bottom: 0 }} barCategoryGap={isYearDaily ? '15%' : '30%'}>
          <defs>
            <linearGradient id="hoursFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.74 0.17 253)" stopOpacity={0.92} />
              <stop offset="100%" stopColor="oklch(0.74 0.17 253)" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={isYearDaily ? 40 : 18} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.62)' }} />
          <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.62)' }} tickFormatter={(v) => `${v}h`} />
          {avgHours > 0 && (
            <ReferenceLine
              y={avgHours}
              stroke="rgba(109,255,212,0.8)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: `śr. ${avgHours.toFixed(1)}h`, position: 'insideTopRight', fontSize: 10, fill: 'rgba(109,255,212,0.8)', dy: -4 }}
            />
          )}
          <ShadTooltip cursor={{ fill: 'rgba(255,255,255,0.08)', opacity: 1 }} content={<ChartTooltip />} />
          <Bar dataKey="hours" radius={isYearDaily ? [3, 3, 0, 0] : [6, 6, 2, 2]}>
            {enriched.map((entry, i) => (
              <Cell key={i} fill={entry.hours > 0 ? 'url(#hoursFill)' : 'rgba(255,255,255,0.12)'} />
            ))}
          </Bar>
          {showRolling && <Line type="monotone" dataKey="rolling" stroke="oklch(0.78 0.14 159)" strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />}
          {showBrush && <Brush dataKey="label" height={20} travellerWidth={8} stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.06)" className="text-2xs" />}
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
