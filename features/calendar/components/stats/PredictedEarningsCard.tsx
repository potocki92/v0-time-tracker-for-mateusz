import { Wallet } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/helpers'
import { KPICard } from './KPICard'
import { pluralizeDays } from './format'

interface Props {
  totalEarningsPLN: number
  realizedEarningsPLN: number
  predictedEarningsPLN: number
  predictedHours: number
  predictedDays: number
  realizedSharePercent: number
}

export function PredictedEarningsCard({
  totalEarningsPLN,
  realizedEarningsPLN,
  predictedEarningsPLN,
  predictedHours,
  predictedDays,
  realizedSharePercent,
}: Props) {
  const hasPlan = predictedEarningsPLN > 0

  return (
    <KPICard
      label="Przewidywany zarobek"
      icon={<Wallet className="h-4 w-4" />}
      ariaLabel={`Przewidywany zarobek: ${formatCurrency(totalEarningsPLN, 'PLN')}; zrealizowano ${realizedSharePercent}%`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-white sm:text-[26px]">
        {formatCurrency(totalEarningsPLN, 'PLN')}
      </p>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-zinc-500">
            Realnie {formatCurrency(realizedEarningsPLN, 'PLN')}
          </span>
          <span className="font-semibold tabular-nums text-emerald-400">
            {realizedSharePercent}%
          </span>
        </div>
        <Progress
          value={realizedSharePercent}
          className="h-1.5 bg-[#161616] [&>div]:bg-emerald-500"
        />
        <p className="text-[10px] text-zinc-500 sm:text-[11px]">
          {hasPlan
            ? `Plan: ${formatCurrency(predictedEarningsPLN, 'PLN')} • ${predictedDays} ${pluralizeDays(
                predictedDays,
              )} • ${predictedHours.toFixed(1)} h`
            : 'Brak zaplanowanych dni'}
        </p>
      </div>
    </KPICard>
  )
}
