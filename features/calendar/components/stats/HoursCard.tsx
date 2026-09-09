import { Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useFormat } from '@/lib/format/client'
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
  const fmt = useFormat()
  return (
    <KPICard
      label="Suma godzin"
      icon={<Clock className="h-4 w-4" />}
      ariaLabel={`Przepracowane godziny: ${fmt.hours(totalHours)} z ${fmt.hours(
        goalHours,
      )} (${fmt.percent(goalProgress)})`}
    >
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {fmt.hours(totalHours)}
      </p>

      <div className="mt-auto space-y-1.5 pt-3">
        <div className="flex items-center justify-between text-2xs">
          <span className="text-zinc-400">Cel: {fmt.hours(goalHours)}</span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              isAhead ? 'text-brand-400' : 'text-zinc-400',
            )}
          >
            {fmt.percent(goalProgress)}
          </span>
        </div>
        <Progress
          aria-label="Realizacja celu godzinowego"
          value={Math.min(100, goalProgress * 100)}
          className="h-1.5 bg-surface-3 transition-colors [&>div]:bg-brand-500"
        />
      </div>
    </KPICard>
  )
}
