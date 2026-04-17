'use client'

import { useDashboardData } from '../../_hooks'
import { useEffectiveEurRate } from '../../_hooks/usePreferencesStore'
import { EarningsChart } from '../chart/EarningsChart'
import { ChartErrorBoundary } from '../errors'

export function ChartSection() {
  const { data } = useDashboardData()
  const { workEntries, clients } = data
  const eurRate = useEffectiveEurRate()

  return (
    <ChartErrorBoundary>
      <EarningsChart
        workEntries={workEntries}
        clients={clients}
        eurToPlnRate={eurRate}
      />
    </ChartErrorBoundary>
  )
}
