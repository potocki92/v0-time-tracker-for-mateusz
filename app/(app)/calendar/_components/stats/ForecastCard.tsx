import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'

interface Props {
  forecastPLN: number
}

export function ForecastCard({ forecastPLN }: Props) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">
              Prognoza zarobków
            </p>
            <p className="mt-1 truncate text-xl font-bold tabular-nums tracking-tight sm:text-2xl">
              {formatCurrency(forecastPLN, 'PLN')}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground sm:text-[11px]">
          Na podstawie przepracowanych dni
        </p>
      </CardContent>
    </Card>
  )
}
