import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import { KPICard } from './KPICard'

interface Props {
  forecastPLN: number
  workDays: number
}

export function ForecastCard({ forecastPLN, workDays }: Props) {
  return (
    <KPICard
      label="Prognoza zarobków"
      icon={<TrendingUp className="h-4 w-4" />}
      accent="emerald"
      ariaLabel={`Prognoza zarobków: ${formatCurrency(forecastPLN, 'PLN')}`}
    >
      <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight sm:text-[26px]">
        {formatCurrency(forecastPLN, 'PLN')}
      </p>
      <p className="mt-3 text-[10px] text-muted-foreground sm:text-[11px]">
        Na podstawie {workDays} {pluralizeDays(workDays)}
      </p>
    </KPICard>
  )
}

function pluralizeDays(n: number): string {
  if (n === 1) return 'przepracowanego dnia'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
    return 'przepracowanych dni'
  }
  return 'przepracowanych dni'
}
