import { Wallet } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { formatHours, formatMoney, formatPercent } from '@/lib/format'
import type { CURRENCY } from '@/lib/types'
import { KPICard } from './KPICard'
import { countDays } from './format'

interface Props {
  forecastEarningsMinor: number
  realizedEarningsMinor: number
  plannedEarningsMinor: number
  plannedHours: number
  plannedDays: number
  /** actual/forecast, 0..1 */
  realizedShare: number
  currency: CURRENCY
}

export function PredictedEarningsCard({
  forecastEarningsMinor,
  realizedEarningsMinor,
  plannedEarningsMinor,
  plannedHours,
  plannedDays,
  realizedShare,
  currency,
}: Props) {
  const hasPlan = plannedDays > 0

  return (
    <KPICard
      label="Przewidywany zarobek"
      icon={<Wallet className="h-4 w-4" />}
      ariaLabel={`Przewidywany zarobek: ${formatMoney(forecastEarningsMinor, currency)}; zrealizowano ${formatPercent(realizedShare)}`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {formatMoney(forecastEarningsMinor, currency)}
      </p>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-2xs">
          <span className="text-zinc-400">
            Realnie {formatMoney(realizedEarningsMinor, currency)}
          </span>
          <span className="font-semibold tabular-nums text-emerald-400">
            {formatPercent(realizedShare)}
          </span>
        </div>
        <Progress
          aria-label="Udział zrealizowanych zarobków w prognozie"
          value={realizedShare * 100}
          className="h-1.5 bg-surface-3 [&>div]:bg-emerald-500"
        />
        <p className="text-2xs text-zinc-400">
          {hasPlan
            ? `Plan: ${formatMoney(plannedEarningsMinor, currency)} • ${countDays(
                plannedDays,
              )} • ${formatHours(plannedHours)}`
            : 'Brak zaplanowanych dni'}
        </p>
      </div>
    </KPICard>
  )
}
