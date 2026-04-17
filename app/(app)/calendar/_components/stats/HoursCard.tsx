import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  totalHours: number
  baselineHours: number
  progressPercent: number
  isAhead: boolean
}

export function HoursCard({ totalHours, baselineHours, progressPercent, isAhead }: Props) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">
              Suma godzin
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums tracking-tight sm:text-2xl">
              {totalHours.toFixed(1)}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground sm:text-sm">h</span>
            </p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-muted-foreground">Cel: {baselineHours}h</span>
            <span
              className={cn(
                'font-semibold',
                isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
              )}
            >
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
  )
}
