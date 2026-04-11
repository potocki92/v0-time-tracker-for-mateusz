import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartContainer } from '@/components/ui/chart'

type Props = {
  data: {
    label: string
    earningsPLN: number
    hours: number
  }[]
}

export function EarningsChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center border border-dashed text-sm text-muted-foreground">
        Brak danych
      </div>
    )
  }

  return (
    <ChartContainer className="h-80 w-full">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="label" />
        <YAxis yAxisId="earnings" />
        <YAxis yAxisId="hours" orientation="right" />

        <Area
          yAxisId="earnings"
          type="monotone"
          dataKey="earningsPLN"
        />

        <Bar
          yAxisId="hours"
          dataKey="hours"
        />
      </ComposedChart>
    </ChartContainer>
  )
}