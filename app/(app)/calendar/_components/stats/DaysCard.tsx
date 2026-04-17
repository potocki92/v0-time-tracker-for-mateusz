import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CalendarCheck } from 'lucide-react'

interface Props {
  workDays: number
  freeDays: number
}

export function DaysCard({ workDays, freeDays }: Props) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">
              Dni w miesiącu
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl">
                {workDays}
              </p>
              <span className="text-xs text-muted-foreground sm:text-sm">/ {freeDays}</span>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="mt-3 flex gap-3 text-[10px] sm:text-[11px]">
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
  )
}
