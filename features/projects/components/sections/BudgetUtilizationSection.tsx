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
      eyebrow="Total budget"
      badge={
        <span
          className={cn(
            'rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-0.5 text-[11px] font-medium tabular-nums',
            tone,
          )}
        >
          {utilizationPct}% used
        </span>
      }
    >
      <div className="border-b border-[#161616] px-4 py-4 sm:px-5">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
          {formatCurrency(utilisation.totalSpent, 'PLN')}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          of {formatCurrency(utilisation.totalBudget, 'PLN')} contracted ·{' '}
          {utilisation.contractedCount} project{utilisation.contractedCount === 1 ? '' : 's'}
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#161616]">
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

      <ul role="list" className="divide-y divide-[#161616]">
        {utilisation.rows.slice(0, 5).map((row) => (
          <BudgetRow
            key={row.projectId}
            projectName={row.projectName}
            projectColor={row.projectColor}
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
