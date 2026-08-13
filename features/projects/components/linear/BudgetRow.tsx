'use client'

import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { BUDGET_OVERSPEND_THRESHOLD, BUDGET_WARNING_THRESHOLD } from '../../types/projects.constants'

type BudgetRowProps = {
  projectName: string
  projectColor: string
  budget: number
  spent: number
  utilization: number
  hours: number
}

export function BudgetRow({
  projectName,
  projectColor,
  budget,
  spent,
  utilization,
  hours,
}: BudgetRowProps) {
  const tone =
    utilization >= BUDGET_OVERSPEND_THRESHOLD
      ? 'text-rose-300'
      : utilization >= BUDGET_WARNING_THRESHOLD
        ? 'text-amber-300'
        : 'text-zinc-300'

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <span
        aria-hidden
        className="h-8 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: projectColor, boxShadow: `0 0 8px ${projectColor}55` }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">{projectName}</p>
        <p className="mt-0.5 text-[11.5px] text-zinc-400">
          {Math.round(hours)} h · {formatCurrency(spent, 'PLN')} wydane
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[13px] font-semibold tabular-nums text-white">
          {formatCurrency(budget, 'PLN')}
        </p>
        <p className={cn('text-[11px] font-medium tabular-nums', tone)}>
          {Math.round(utilization * 100)}%
        </p>
      </div>
    </li>
  )
}
