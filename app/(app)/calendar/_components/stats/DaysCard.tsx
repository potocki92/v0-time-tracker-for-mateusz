import { CalendarCheck } from 'lucide-react'
import { KPICard } from './KPICard'

interface Props {
  workDays: number
  freeDays: number
}

export function DaysCard({ workDays, freeDays }: Props) {
  return (
    <KPICard
      label="Dni w miesiącu"
      icon={<CalendarCheck className="h-4 w-4" />}
      ariaLabel={`${workDays} dni pracy, ${freeDays} dni wolnych`}
    >
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-white sm:text-[26px]">{workDays}</p>
        <span className="text-xs text-zinc-500 sm:text-sm">/ {freeDays}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px]">
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {workDays} pracy
        </span>
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {freeDays} wolnych
        </span>
      </div>
    </KPICard>
  )
}
