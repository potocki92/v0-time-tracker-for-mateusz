import { Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { formatHours, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { KPICard } from './KPICard'

interface Props {
  totalHours: number
  goalHours: number
  /** actual/goal, 0..n — procent liczy warstwa formatowania */
  goalProgress: number
  isAhead: boolean
}

export function HoursCard({ totalHours, goalHours, goalProgress, isAhead }: Props) {
  return (
    <KPICard
      label="Suma godzin"
      icon={<Clock className="h-4 w-4" />}
      ariaLabel={`Przepracowane godziny: ${formatHours(totalHours)} z ${formatHours(
        goalHours,
      )} (${formatPercent(goalProgress)})`}
    >
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {formatHours(totalHours)}
      </p>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-2xs">
          <span className="text-zinc-400">Cel: {formatHours(goalHours)}</span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              isAhead ? 'text-emerald-400' : 'text-zinc-400',
            )}
          >
            {formatPercent(goalProgress)}
          </span>
        </div>
        <Progress
          aria-label="Realizacja celu godzinowego"
          value={Math.min(100, goalProgress * 100)}
          className="h-1.5 bg-surface-3 transition-colors [&>div]:bg-emerald-500"
        />
      </div>
    </KPICard>
  )
}
