import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'

type Props = {
  totalPLN: number
  totalEUR: number
  trend?: number | null
}

export function EarningsCard({ totalPLN, totalEUR, trend }: Props) {
  const hasTrend = trend !== null && trend !== undefined
  const isPositive = hasTrend && trend >= 0

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Zarobki
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-bold">
          {formatCurrency(totalPLN, 'PLN')}
        </div>
        {totalEUR > 0 && (
          <p className="text-sm text-muted-foreground">
            w tym {formatCurrency(totalEUR, 'EUR')}
          </p>
        )}
        {hasTrend && (
          <p className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-red-500/10 text-red-500'
          }`}>
            {isPositive
              ? <ArrowUpRight className="h-3.5 w-3.5" />
              : <ArrowDownRight className="h-3.5 w-3.5" />}
            {isPositive ? '+' : ''}{trend.toFixed(1)}%
          </p>
        )}
      </CardContent>
    </Card>
  )
}
