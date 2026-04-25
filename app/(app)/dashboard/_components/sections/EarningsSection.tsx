'use client'

import { useMemo } from 'react'
import { useDashboardData } from '../../_hooks'
import { useFilteredEntries } from '../../_hooks/useFilteredEntries'
import { useEarningsTrend } from '../../_hooks/useEarningsTrend'
import { useEarningsSparkline } from '../../_hooks/useEarningsSparkline'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { useGoal } from '../../_hooks/usePreferencesStore'
import { useDashboardTotals } from '../../_hooks/useDashboardTotal'
import { calculateGoalProgress } from '@/lib/finance/goal'
import { EarningsCardBoundary } from '../errors'
import { EarningsOverview } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

export function EarningsSection() {
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
    () => calculateGoalProgress(goal, totals),
    [goal, totals],
  )

  return (
    <EarningsCardBoundary>
      <EarningsOverview
        totalPLN={totals.totalEarningsAllPLN}
        totalEUR={totals.earningsEUR}
        trend={trend}
        sparklineData={sparklineData}
        periodLabel={periodLabel}
        goalProgress={goalProgress}
        goalAmount={goal?.amount ?? 0}
        goalCurrency={goal?.currency ?? 'PLN'}
      />
    </EarningsCardBoundary>
  )
}
