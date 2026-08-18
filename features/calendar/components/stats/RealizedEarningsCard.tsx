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
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-white sm:text-[26px]">
        {formatCurrency(realizedEarningsPLN, 'PLN')}
      </p>
      <p className="mt-3 text-[10px] text-zinc-500 sm:text-[11px]">
        {realizedDays} {pluralizeDays(realizedDays)} • {realizedHours.toFixed(1)} h
      </p>
    </KPICard>
  )
}
