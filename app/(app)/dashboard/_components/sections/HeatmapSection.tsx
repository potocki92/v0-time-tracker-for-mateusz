'use client'

import { useDashboardData } from '../../_hooks'
import { ChartErrorBoundary } from '../errors'
import { HoursHeatmap } from '../linear'

export function HeatmapSection() {
  const { data } = useDashboardData()
  return (
    <ChartErrorBoundary>
      <HoursHeatmap entries={data.workEntries} />
    </ChartErrorBoundary>
  )
}
