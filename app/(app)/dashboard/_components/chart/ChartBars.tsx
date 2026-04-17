import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip as ShadTooltip, type ChartConfig } from '@/components/ui/chart'
import { ChartTooltip } from './ChartTooltip'

const chartConfig = {
  hours: { label: 'Godziny', color: 'var(--chart-1)' },
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

export function ChartBars({ data, avgHours, isYearDaily }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart
        data={data}
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
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.hours > 0 ? 'var(--chart-1)' : 'var(--border)'}
              fillOpacity={entry.hours > 0 ? 0.85 : 0.2}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
