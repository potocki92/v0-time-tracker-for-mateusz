import { Flame } from 'lucide-react'
import { KPICard } from './KPICard'

interface Props {
  current: number
  longestThisYear: number
}

/**
 * Pokazuje aktualny streak dni roboczych (`worked` z rzędu, pomijając weekendy
 * i dni urlopowe) oraz rekord roku. Liczone deterministycznie z `workEntries`,
 * więc karta zawsze pokazuje realny stan — bez mocków.
 */
export function ActiveStreakCard({ current, longestThisYear }: Props) {
  return (
    <KPICard
      label="Aktywna seria"
      icon={<Flame className="h-4 w-4" />}
      ariaLabel={`Aktualny streak: ${current} dni, najdłuższy w tym roku: ${longestThisYear} dni`}
    >
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white sm:text-[26px]">
        {current}
        <span className="ml-1 text-xs font-medium text-zinc-500 sm:text-sm">
          {pluralizeDay(current)}
        </span>
      </p>
      <p className="mt-3 text-[10px] text-zinc-500 sm:text-[11px]">
        Najdłuższy w tym roku ·{' '}
        <span className="font-semibold text-zinc-300 tabular-nums">
          {longestThisYear} d
        </span>
      </p>
    </KPICard>
  )
}

function pluralizeDay(n: number): string {
  if (n === 1) return 'dzień'
  return 'dni'
}
