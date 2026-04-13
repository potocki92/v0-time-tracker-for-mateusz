import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/helpers'
import { Clock, TrendingUp, CalendarCheck, CalendarOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarStatsProps {
  totalHours: number
  forecastPLN: number
  workDays: number
  freeDays: number
  progressPercent: number
  baselineHours: number
}

export function CalendarStats({
  totalHours,
  forecastPLN,
  workDays,
  freeDays,
  progressPercent,
  baselineHours,
}: CalendarStatsProps) {
  const isAhead = progressPercent >= 100

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Hours card */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Suma godzin
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
                {totalHours.toFixed(1)}
                <span className="ml-0.5 text-sm font-normal text-muted-foreground">h</span>
              </p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Cel: {baselineHours}h</span>
              <span className={cn('font-semibold', isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress
              value={progressPercent}
              className={cn('h-1.5', isAhead ? '[&>div]:bg-emerald-500' : '[&>div]:bg-blue-500')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Earnings card */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Prognoza zarobków
              </p>
              <p className="mt-1 truncate text-2xl font-bold tabular-nums tracking-tight">
                {formatCurrency(forecastPLN, 'PLN')}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Na podstawie przepracowanych dni
          </p>
        </CardContent>
      </Card>

      {/* Work / Free days */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Dni w miesiącu
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums tracking-tight">{workDays}</p>
                <span className="text-sm text-muted-foreground">/ {freeDays}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {workDays} pracy
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              {freeDays} wolnych
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}