'use client'

import { useDashboardData } from '../../../hooks'
import { useFilteredEntries } from '../../../hooks/useFilteredEntries'
import { useDashboardTotals } from '../../../hooks/useDashboardTotal'
import { usePeriodLabel } from '../../../hooks/usePeriodLabel'
import { ChartErrorBoundary } from '../../errors'
import { HoursCard } from './HoursCard'
import { useDashboardRange } from '../shared/DashboardRangeContext'

const DEFAULT_TARGET_BY_RANGE: Record<string, number> = {
  current_week: 40,
  previous_week: 40,
  current_month: 160,
  previous_month: 160,
  current_quarter: 480,
  current_year: 1920,
  all: 1920,
}

function periodShort(label: string): string {
  return label.split(' ').slice(-1)[0] ?? label
}

export function HoursSection() {
  const { data } = useDashboardData()
  const { range, dateRange } = useDashboardRange()
  const filtered = useFilteredEntries(data.workEntries, dateRange)
  const totals = useDashboardTotals(filtered, data.clients)
  const target = DEFAULT_TARGET_BY_RANGE[range] ?? 160
  const periodLabel = usePeriodLabel(range)

  return (
    <ChartErrorBoundary>
      <HoursCard
        totalHours={totals.totalHours}
        totalDays={totals.totalDays}
        targetHours={target}
        periodLabel={periodShort(periodLabel) || 'period'}
        entries={filtered}
      />
    </ChartErrorBoundary>
  )
}
