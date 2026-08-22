import { Wallet } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/helpers'
import type { CURRENCY } from '@/lib/types'
import { KPICard } from './KPICard'
import { pluralizeDays } from './format'

interface Props {
  forecastEarnings: number
  realizedEarnings: number
  plannedEarnings: number
  plannedHours: number
  plannedDays: number
  realizedSharePercent: number
  currency: CURRENCY
}

export function PredictedEarningsCard({
  forecastEarnings,
  realizedEarnings,
  plannedEarnings,
  plannedHours,
  plannedDays,
  realizedSharePercent,
  currency,
}: Props) {
  const hasPlan = plannedDays > 0

  return (
    <KPICard
      label="Przewidywany zarobek"
      icon={<Wallet className="h-4 w-4" />}
      ariaLabel={`Przewidywany zarobek: ${formatCurrency(forecastEarnings, currency)}; zrealizowano ${realizedSharePercent}%`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {formatCurrency(forecastEarnings, currency)}
      </p>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-2xs">
          <span className="text-zinc-400">
            Realnie {formatCurrency(realizedEarnings, currency)}
          </span>
          <span className="font-semibold tabular-nums text-emerald-400">
            {realizedSharePercent}%
          </span>
        </div>
        <Progress
          aria-label="Udział zrealizowanych zarobków w prognozie"
          value={realizedSharePercent}
          className="h-1.5 bg-surface-3 [&>div]:bg-emerald-500"
        />
        <p className="text-2xs text-zinc-400">
          {hasPlan
            ? `Plan: ${formatCurrency(plannedEarnings, currency)} • ${plannedDays} ${pluralizeDays(
                plannedDays,
              )} • ${plannedHours.toFixed(1)} h`
            : 'Brak zaplanowanych dni'}
        </p>
      </div>
    </KPICard>
  )
}
