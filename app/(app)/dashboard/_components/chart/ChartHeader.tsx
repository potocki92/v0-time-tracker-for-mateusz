import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { CardDescription, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'

type Props = {
  trend: number | null
  totalHours: number
  totalEarnings: { pln: number; eur: number }
}

export function ChartHeader({ trend, totalHours, totalEarnings }: Props) {
  return (
    <>
      <div className="flex items-center gap-2">
        <CardTitle className="text-sm font-semibold">Analiza aktywności</CardTitle>
        {trend !== null && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            trend > 0 ? 'bg-[var(--chart-1)]/10 text-[var(--chart-1)]'
            : trend < 0 ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-muted-foreground'
          }`}>
            {trend > 0 ? <TrendingUp className="h-2.5 w-2.5" />
              : trend < 0 ? <TrendingDown className="h-2.5 w-2.5" />
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
    </>
  )
}
