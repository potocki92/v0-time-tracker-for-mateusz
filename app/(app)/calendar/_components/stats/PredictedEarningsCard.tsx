import { Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import { KPICard } from './KPICard'

interface Props {
  predictedEarningsPLN: number
  realizedEarningsPLN: number
}

export function PredictedEarningsCard({ predictedEarningsPLN, realizedEarningsPLN }: Props) {
  return (
    <KPICard
      label="Przewidywany zarobek"
      icon={<Wallet className="h-4 w-4" />}
      accent="violet"
      ariaLabel={`Przewidywany zarobek: ${formatCurrency(realizedEarningsPLN + predictedEarningsPLN, 'PLN')}`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight sm:text-[26px]">
        {formatCurrency(realizedEarningsPLN + predictedEarningsPLN, 'PLN')}
      </p>
      <p className="mt-3 text-[10px] text-muted-foreground sm:text-[11px]">
        Realnie: {formatCurrency(realizedEarningsPLN, 'PLN')} • Plan: {formatCurrency(predictedEarningsPLN, 'PLN')}
      </p>
    </KPICard>
  )
}
