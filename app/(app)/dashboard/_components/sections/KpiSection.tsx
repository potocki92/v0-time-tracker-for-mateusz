'use client'

import { useMemo } from 'react'
import { useDashboardData } from '../../_hooks'
import { useFilteredEntries } from '../../_hooks/useFilteredEntries'
import { useEarningsTrend } from '../../_hooks/useEarningsTrend'
import { useEarningsSparkline } from '../../_hooks/useEarningsSparkline'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { useGoal } from '../../_hooks/usePreferencesStore'
import { useDashboardTotals } from '../../_hooks/useDashboardTotal'
import { EarningsCard } from '../card/EarningsCard'
import { GoalCard } from '../card/GoalCard'
import { EarningsCardBoundary, GoalCardBoundary } from '../errors'
import { useDashboardRange } from './DashboardRangeContext'

export function KpiSection() {
  const { data } = useDashboardData()
  const { range, dateRange, prevRange } = useDashboardRange()
  const { workEntries, clients } = data
  const goal = useGoal()

  const filtered = useFilteredEntries(workEntries, dateRange)
  const prevFiltered = useFilteredEntries(workEntries, prevRange)
  const totals = useDashboardTotals(filtered, clients)
  const trend = useEarningsTrend(filtered, prevFiltered, clients)
  const sparklineData = useEarningsSparkline(filtered, clients)
  const periodLabel = usePeriodLabel(range)

  const goalProgress = useMemo(
    () => (goal?.amount ? (totals.totalEarningsAllPLN / goal.amount) * 100 : 0),
    [goal?.amount, totals.totalEarningsAllPLN],
  )

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <EarningsCardBoundary>
          <EarningsCard
            totalPLN={totals.totalEarningsAllPLN}
            totalEUR={totals.earningsEUR}
            earningsOnlyPLN={totals.earningsPLN}
            trend={trend}
            sparklineData={sparklineData}
            periodLabel={periodLabel}
          />
        </EarningsCardBoundary>
      </div>

      <div className="lg:col-span-4">
        <GoalCardBoundary>
          <GoalCard
            progress={goalProgress}
            target={goal?.amount ?? 0}
            currency={goal?.currency ?? 'PLN'}
            variant="radial"
          />
        </GoalCardBoundary>
      </div>
    </div>
  )
}
