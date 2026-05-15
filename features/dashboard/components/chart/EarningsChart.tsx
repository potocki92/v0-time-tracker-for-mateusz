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
  const {
    grouping,
    period,
    dateRange,
    prevRange,
    isYearDaily,
    handleGroupingChange,
    setPeriod,
  } = useChartState()

  const { mergedData, totalHours, totalEarnings, avgHours, trend, isEmpty } = useChartMetrics(
    workEntries, clients, eurToPlnRate, grouping, dateRange, prevRange
  )

  return (
    <Card className="w-full gap-3 overflow-hidden rounded-lg py-4 sm:gap-4">
      <CardHeader className="gap-2 px-4 pb-2 sm:pt-1">
        <ChartHeader
          trend={trend}
          totalHours={totalHours}
          totalEarnings={totalEarnings}
        />
        <ChartControls
          grouping={grouping}
          period={period}
          onGroupingChange={handleGroupingChange}
          onPeriodChange={setPeriod}
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
