'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Client, WorkEntry } from '@/lib/types'
import { useChartState } from './hooks/useChartState'
import { useChartMetrics } from './hooks/useChartMetrics'
import { ChartHeader } from './ChartHeader'
import { ChartControls } from './ChartControls'
import { ChartEmptyState } from './ChartEmptyState'

// recharts to najcięższa zależność dashboardu i nie jest potrzebna do
// pierwszego renderu — nagłówek i kontrolki wykresu pokazują się od razu,
// same słupki doładowują się osobnym chunkiem.
//
// Wysokość placeholdera MUSI odpowiadać wysokości `ChartContainer`
// w `ChartBars` (220 px) — inaczej podmiana chunku przesuwa stronę.
const ChartBars = dynamic(() => import('./ChartBars').then((mod) => mod.ChartBars), {
  ssr: false,
  loading: () => <Skeleton className="h-[220px] w-full" />,
})

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

  // Ten sam literał powierzchni, co `HoursCard` i `ActivityCard` — karta
  // przestaje być jedynym shadcnowym `Card` w kolumnie głównej pulpitu.
  return (
    <section
      aria-label="Analiza aktywności"
      className="rounded-lg border border-hairline bg-surface-1 p-4"
    >
      <ChartHeader
        trend={trend}
        totalHours={totalHours}
        totalEarnings={totalEarnings}
        avgHours={avgHours}
      />
      <ChartControls
        grouping={grouping}
        period={period}
        onGroupingChange={handleGroupingChange}
        onPeriodChange={setPeriod}
      />
      <div className="mt-3">
        {isEmpty ? (
          <ChartEmptyState />
        ) : (
          <ChartBars data={mergedData} avgHours={avgHours} isYearDaily={isYearDaily} />
        )}
      </div>
    </section>
  )
}
