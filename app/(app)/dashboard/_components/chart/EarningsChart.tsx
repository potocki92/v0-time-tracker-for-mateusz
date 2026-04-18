'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Client, WorkEntry } from '@/lib/types'
import { useChartState } from './hooks/useChartState'
import { useChartMetrics } from './hooks/useChartMetrics'
import { ChartHeader } from './ChartHeader'
import { ChartControls } from './ChartControls'
import { ChartBars } from './ChartBars'
import { ChartEmptyState } from './ChartEmptyState'

type Props = {
  workEntries: WorkEntry[]
  clients: Client[]
  eurToPlnRate: number
}

export function EarningsChart({ workEntries, clients, eurToPlnRate }: Props) {
  const { grouping, effectiveGrouping, dateRange, prevRange, isYearDaily, setGrouping } = useChartState()

  const { mergedData, totalHours, totalEarnings, avgHours, trend, isEmpty } = useChartMetrics(
    workEntries, clients, eurToPlnRate, effectiveGrouping, dateRange, prevRange
  )

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <ChartHeader
          trend={trend}
          totalHours={totalHours}
          totalEarnings={totalEarnings}
        />
        <ChartControls
          grouping={grouping}
          effectiveGrouping={effectiveGrouping}
          onGroupingChange={setGrouping}
        />
      </CardHeader>
      <CardContent className="px-1 pb-3 sm:px-3">
        {isEmpty ? (
          <ChartEmptyState />
        ) : (
          <ChartBars data={mergedData} avgHours={avgHours} isYearDaily={isYearDaily} />
        )}
      </CardContent>
    </Card>
  )
}
