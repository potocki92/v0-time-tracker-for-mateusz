import { Coins } from 'lucide-react'
import { useFormat } from '@/lib/format/client'
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
  const fmt = useFormat()
  return (
    <KPICard
      label="Zarobione"
      icon={<Coins className="h-4 w-4" />}
      ariaLabel={`Zarobione do dziś: ${fmt.money(realizedEarningsMinor, currency)} w ${countDays(fmt, realizedDays)}`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {fmt.money(realizedEarningsMinor, currency)}
      </p>
      <p className="mt-auto pt-3 text-2xs text-zinc-400">
        {countDays(fmt, realizedDays)} • {fmt.hours(realizedHours)}
      </p>
    </KPICard>
  )
}
