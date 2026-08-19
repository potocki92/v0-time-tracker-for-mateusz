import { Coins } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import { KPICard } from './KPICard'
import { pluralizeDays } from './format'

interface Props {
  realizedEarningsPLN: number
  realizedHours: number
  realizedDays: number
}

export function RealizedEarningsCard({
  realizedEarningsPLN,
  realizedHours,
  realizedDays,
}: Props) {
  return (
    <KPICard
      label="Zarobione"
      icon={<Coins className="h-4 w-4" />}
      ariaLabel={`Zarobione do dziś: ${formatCurrency(realizedEarningsPLN, 'PLN')} w ${realizedDays} ${pluralizeDays(realizedDays)}`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        {formatCurrency(realizedEarningsPLN, 'PLN')}
      </p>
      <p className="mt-3 text-2xs text-zinc-500">
        {realizedDays} {pluralizeDays(realizedDays)} • {realizedHours.toFixed(1)} h
      </p>
    </KPICard>
  )
}
