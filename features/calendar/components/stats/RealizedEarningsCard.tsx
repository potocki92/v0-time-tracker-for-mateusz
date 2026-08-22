import { Coins } from 'lucide-react'
import { formatHours, formatMoney } from '@/lib/format'
import type { CURRENCY } from '@/lib/types'
import { KPICard } from './KPICard'
import { countDays } from './format'

interface Props {
  realizedEarningsMinor: number
  realizedHours: number
  realizedDays: number
  currency: CURRENCY
}

export function RealizedEarningsCard({
  realizedEarningsMinor,
  realizedHours,
  realizedDays,
  currency,
}: Props) {
  return (
    <KPICard
      label="Zarobione"
      icon={<Coins className="h-4 w-4" />}
      ariaLabel={`Zarobione do dziś: ${formatMoney(realizedEarningsMinor, currency)} w ${countDays(realizedDays)}`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {formatMoney(realizedEarningsMinor, currency)}
      </p>
      <p className="mt-3 text-2xs text-zinc-400">
        {countDays(realizedDays)} • {formatHours(realizedHours)}
      </p>
    </KPICard>
  )
}
