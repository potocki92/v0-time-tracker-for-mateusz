import { Flame } from 'lucide-react'
import { KPICard } from './KPICard'

interface Props {
  current: number
  longest: number
}

/**
 * Aktualna seria dni z wpisem (liczona wstecz od dziś) oraz rekord w historii.
 * Obie liczby przychodzą z `computeMonthMetrics` — tego samego rachunku, który
 * pokazuje pigułka serii na Pulpicie.
 */
export function ActiveStreakCard({ current, longest }: Props) {
  return (
    <KPICard
      label="Aktywna seria"
      icon={<Flame className="h-4 w-4" />}
      ariaLabel={`Aktualna seria: ${current} dni, najdłuższa: ${longest} dni`}
    >
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {current}
        <span className="ml-1 text-xs font-medium text-zinc-400 sm:text-sm">
          {pluralizeDay(current)}
        </span>
      </p>
      <p className="mt-3 text-2xs text-zinc-400">
        Najdłuższa ·{' '}
        <span className="font-semibold text-zinc-300 tabular-nums">{longest} d</span>
      </p>
    </KPICard>
  )
}

function pluralizeDay(n: number): string {
  if (n === 1) return 'dzień'
  return 'dni'
}
