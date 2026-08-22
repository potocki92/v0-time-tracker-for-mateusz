'use client'

import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  BUDGET_OVERSPEND_THRESHOLD,
  BUDGET_WARNING_THRESHOLD,
} from '../../types/projects.constants'
import { useBudgetUtilization } from '../../hooks/useBudgetUtilization'
import { useProjectsData } from '../../hooks/useProjectsData'
import { BudgetRow } from '../linear/BudgetRow'
import { LinearCard } from '../linear/LinearCard'
import { LINEAR } from '@/components/ui/tokens'

export function BudgetUtilizationSection() {
  const { data } = useProjectsData()
  const utilisation = useBudgetUtilization(data)

  if (utilisation.contractedCount === 0) return null

  const utilizationPct = Math.round(utilisation.utilization * 100)
  const tone =
    utilisation.utilization >= BUDGET_OVERSPEND_THRESHOLD
      ? 'text-rose-300'
      : utilisation.utilization >= BUDGET_WARNING_THRESHOLD
        ? 'text-amber-300'
        : 'text-emerald-300'

  return (
    <LinearCard
      eyebrow="Budżet portfela"
      badge={
        <span
          className={cn(
            'rounded-md border px-2 py-0.5 text-2xs font-medium tabular-nums',
            LINEAR.border,
            LINEAR.surfaceElevated,
            tone,
          )}
        >
          {utilizationPct}% wykorzystania
        </span>
      }
    >
      <div className={cn('border-b px-4 py-4 sm:px-5', LINEAR.borderInset)}>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
          {formatCurrency(utilisation.totalSpent, 'PLN')}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          z {formatCurrency(utilisation.totalBudget, 'PLN')} w umowach ·{' '}
          {utilisation.contractedCount}{' '}
          {utilisation.contractedCount === 1 ? 'projekt' : 'projektów'}
        </p>
        <div className={cn('mt-3 h-1.5 w-full overflow-hidden rounded-full', LINEAR.track)}>
          <div
            className={cn(
              'h-full rounded-full',
              utilisation.utilization >= BUDGET_OVERSPEND_THRESHOLD
                ? 'bg-rose-500'
                : utilisation.utilization >= BUDGET_WARNING_THRESHOLD
                  ? 'bg-amber-500'
                  : 'bg-emerald-500',
            )}
            style={{ width: `${Math.min(100, utilizationPct)}%` }}
            aria-hidden
          />
        </div>
      </div>

      <ul role="list" className={cn('divide-y', LINEAR.divider)}>
        {utilisation.rows.slice(0, 5).map((row) => (
          <BudgetRow
            key={row.projectId}
            projectName={row.projectName}
            budget={row.budget}
            spent={row.spent}
            utilization={row.utilization}
            hours={row.hours}
          />
        ))}
      </ul>
    </LinearCard>
  )
}
