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
import { formatHours } from '@/lib/format'
import { ChartTooltip } from './ChartTooltip'

// Kolory z tokenow motywu, nie z literalow oklch: panel ma piec palet
// (`--chart-1..5` w `app/globals.css`), a wykres malowal sie na sztywno
// niebieskim, wiec na kazdym motywie poza domyslnym byl obcym cialem.
const chartConfig = {
  hours: { label: 'Godziny', color: 'var(--chart-1)' },
  rolling: { label: 'Trend (7)', color: 'var(--chart-2)' },
} satisfies ChartConfig

/** Siatka i osie — neutralne, liczone z `--foreground`, a nie bialy rgba. */
const AXIS = 'color-mix(in oklab, var(--foreground) 55%, transparent)'
const GRID = 'color-mix(in oklab, var(--foreground) 12%, transparent)'

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
    return { ...d, rolling: Math.round((sum / WINDOW) * 10) / 10 }
  })
}

export function ChartBars({ data, avgHours, isYearDaily }: Props) {
  const enriched = useMemo(() => withRollingAverage(data), [data])
  const showRolling = data.length >= 7
  const showBrush = data.length > 14

  return (
    <>
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <ComposedChart data={enriched} margin={{ top: 14, right: 8, left: -2, bottom: 0 }} barCategoryGap={isYearDaily ? '15%' : '30%'}>
          <defs>
            <linearGradient id="hoursFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.30} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="4 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={isYearDaily ? 40 : 18} tick={{ fontSize: 11, fill: AXIS }} />
          <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 11, fill: AXIS }} tickFormatter={(v) => formatHours(v)} />
          {avgHours > 0 && (
            <ReferenceLine
              y={avgHours}
              stroke="var(--chart-2)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          )}
          <ShadTooltip cursor={{ fill: GRID, opacity: 1 }} content={<ChartTooltip />} />
          <Bar dataKey="hours" radius={isYearDaily ? [3, 3, 0, 0] : [6, 6, 2, 2]}>
            {enriched.map((entry, i) => (
              <Cell key={i} fill={entry.hours > 0 ? 'url(#hoursFill)' : GRID} />
            ))}
          </Bar>
          {showRolling && <Line type="monotone" dataKey="rolling" stroke="var(--chart-2)" strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />}
          {showBrush && <Brush dataKey="label" height={20} travellerWidth={8} stroke="var(--hairline-strong)" fill="var(--surface-2)" className="text-2xs" />}
        </ComposedChart>
      </ChartContainer>

      {/* Wykres jest `role="img"` bez tresci dla czytnika ekranu — te same
          liczby w formie tabeli, wzorem
          `features/calendar/components/insights/HoursPerWeekChart.tsx`. */}
      <table className="sr-only">
        <caption>Godziny w kolejnych okresach</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.date || d.label}>
              <th scope="row">{d.label}</th>
              <td>{formatHours(d.hours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
