'use client'

import { useMemo } from 'react'
import { useDashboardData } from '../../_hooks'
import { useFilteredEntries } from '../../_hooks/useFilteredEntries'
import { useDashboardTotals } from '../../_hooks/useDashboardTotal'
import { StatsCards } from '../card/StatsCards'
import { StatsErrorBoundary } from '../errors'
import { useDashboardRange } from './DashboardRangeContext'

export function StatsSection() {
  const { data } = useDashboardData()
  const { dateRange } = useDashboardRange()
  const { workEntries, clients } = data

  const filtered = useFilteredEntries(workEntries, dateRange)
  const totals = useDashboardTotals(filtered, clients)

  const clientsCount = useMemo(
    () => new Set(filtered.map((e) => e.client_id).filter(Boolean)).size,
    [filtered],
  )

  return (
    <StatsErrorBoundary>
      <StatsCards
        totalHours={totals.totalHours}
        totalDays={totals.totalDays}
        clientsCount={clientsCount}
        absences={totals.vacationDays + totals.sickDays}
      />
    </StatsErrorBoundary>
  )
}
