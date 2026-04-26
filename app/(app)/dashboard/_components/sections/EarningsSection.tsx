'use client'

import { useDashboardData } from '../../_hooks'
import { useFilteredEntries } from '../../_hooks/useFilteredEntries'
import { useEarningsTrend } from '../../_hooks/useEarningsTrend'
import { useEarningsSparkline } from '../../_hooks/useEarningsSparkline'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { useDashboardTotals } from '../../_hooks/useDashboardTotal'
import { useEffectiveEurRate } from '../../_hooks/usePreferencesStore'
import { EarningsCardBoundary } from '../errors'
import { EarningsCard } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

function periodShort(label: string): string {
  return label.split(' ').slice(-1)[0] ?? label
}

export function EarningsSection() {
  const { data } = useDashboardData()
  const { range, dateRange, prevRange } = useDashboardRange()
  const { workEntries, clients } = data

  const filtered = useFilteredEntries(workEntries, dateRange)
  const prevFiltered = useFilteredEntries(workEntries, prevRange)
  const totals = useDashboardTotals(filtered, clients)
  const trend = useEarningsTrend(filtered, prevFiltered, clients)
  const sparklineData = useEarningsSparkline(filtered, clients)
  const periodLabel = usePeriodLabel(range)
  const eurRate = useEffectiveEurRate()

  const totalEUR = eurRate > 0 ? totals.totalEarningsAllPLN / eurRate : 0

  return (
    <EarningsCardBoundary>
      <EarningsCard
        totalPLN={totals.totalEarningsAllPLN}
        totalEUR={totalEUR}
        trend={trend}
        sparklineData={sparklineData}
        periodLabel={periodShort(periodLabel) || 'okres'}
      />
    </EarningsCardBoundary>
  )
}
