import { Coins } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import type { CURRENCY } from '@/lib/types'
import { KPICard } from './KPICard'
import { pluralizeDays } from './format'

interface Props {
  realizedEarnings: number
  realizedHours: number
  realizedDays: number
  currency: CURRENCY
}

export function RealizedEarningsCard({
  realizedEarnings,
  realizedHours,
  realizedDays,
  currency,
}: Props) {
  return (
    <KPICard
      label="Zarobione"
      icon={<Coins className="h-4 w-4" />}
      ariaLabel={`Zarobione do dziś: ${formatCurrency(realizedEarnings, currency)} w ${realizedDays} ${pluralizeDays(realizedDays)}`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {formatCurrency(realizedEarnings, currency)}
      </p>
      <p className="mt-3 text-2xs text-zinc-400">
        {realizedDays} {pluralizeDays(realizedDays)} • {realizedHours.toFixed(1)} h
      </p>
    </KPICard>
  )
}
