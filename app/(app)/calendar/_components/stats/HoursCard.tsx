import { Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { KPICard } from './KPICard'

interface Props {
  totalHours: number
  baselineHours: number
  progressPercent: number
  isAhead: boolean
}

export function HoursCard({ totalHours, baselineHours, progressPercent, isAhead }: Props) {
  return (
    <KPICard
      label="Suma godzin"
      icon={<Clock className="h-4 w-4" />}
      ariaLabel={`Przepracowane godziny: ${totalHours.toFixed(1)} z ${baselineHours} (${Math.round(
        progressPercent,
      )}%)`}
    >
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white sm:text-[26px]">
        {totalHours.toFixed(1)}
        <span className="ml-0.5 text-xs font-normal text-zinc-500 sm:text-sm">h</span>
      </p>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-zinc-500">Cel: {baselineHours}h</span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              isAhead ? 'text-emerald-400' : 'text-zinc-500',
            )}
          >
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress
          value={progressPercent}
          className="h-1.5 bg-[#161616] transition-colors [&>div]:bg-emerald-500"
        />
      </div>
    </KPICard>
  )
}
