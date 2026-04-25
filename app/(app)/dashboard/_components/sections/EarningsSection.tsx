'use client'

import { useDashboardData } from '../../_hooks'
import { useFilteredEntries } from '../../_hooks/useFilteredEntries'
import { useEarningsTrend } from '../../_hooks/useEarningsTrend'
import { useEarningsSparkline } from '../../_hooks/useEarningsSparkline'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { useDashboardTotals } from '../../_hooks/useDashboardTotal'
import { EarningsCardBoundary } from '../errors'
import { EarningsCard } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

function periodShort(label: string): string {
  // Take first word + capitalize → e.g. "Obecny miesiąc" → "Miesiąc"
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

  return (
    <EarningsCardBoundary>
      <EarningsCard
        totalPLN={totals.totalEarningsAllPLN}
        trend={trend}
        sparklineData={sparklineData}
        periodLabel={periodShort(periodLabel) || 'period'}
      />
    </EarningsCardBoundary>
  )
}
