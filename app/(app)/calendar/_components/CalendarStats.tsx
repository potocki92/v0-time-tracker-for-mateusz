import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/helpers'

interface CalendarStatsProps {
  totalHours: number
  forecastPLN: number
  workDays: number
  freeDays: number
  progressPercent: number
  baselineHours: number
}

export function CalendarStats({ totalHours, forecastPLN, workDays, freeDays, progressPercent, baselineHours }: CalendarStatsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Suma godzin w miesiącu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Postęp do średniej</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} />
            <p className="text-[11px] text-muted-foreground">Cel porównawczy: {baselineHours}h</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Prognozowane zarobki (PLN)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(forecastPLN, 'PLN')}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dni pracujące vs wolne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{workDays} / {freeDays}</div>
          <p className="text-xs text-muted-foreground">Pracujące / Wolne</p>
        </CardContent>
      </Card>
    </div>
  )
}
