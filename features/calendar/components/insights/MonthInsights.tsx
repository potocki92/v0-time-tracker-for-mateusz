'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { MonthMetrics } from '@/lib/metrics/types'
import type { CalendarInsights } from '../../domain/calendar.types'
import { DayComposition } from './DayComposition'

// recharts osobnym chunkiem — kalendarz renderuje się bez czekania na wykres.
const HoursPerWeekChart = dynamic(
  () => import('./HoursPerWeekChart').then((mod) => mod.HoursPerWeekChart),
  { ssr: false, loading: () => <Skeleton className="h-[180px] w-full" /> },
)
import { RecentEntries } from './RecentEntries'
import { TimeByProject } from './TimeByProject'

interface Props {
  monthName: string
  metrics: MonthMetrics
  insights: CalendarInsights
  onViewAllEntries?: () => void
}

/**
 * Sekcja "Month Insights" — kontener bento-grid 2-kolumnowego (desktop)
 * z wykresem słupkowym i 3 dodatkowymi widgetami w 2 rzędach.
 * Mobile: pojedyncza kolumna z naturalnym porządkiem od góry do dołu.
 */
export function MonthInsights({
  monthName,
  metrics,
  insights,
  onViewAllEntries,
}: Props) {
  return (
    <section
      aria-labelledby="month-insights-heading"
      className="space-y-3 sm:space-y-4"
    >
      <div className="flex items-baseline justify-between gap-2 px-1">
        <SectionEyebrow as="h2" id="month-insights-heading">
          Podsumowanie miesiąca
        </SectionEyebrow>
        <span className="text-2xs capitalize text-zinc-400">
          {monthName}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <HoursPerWeekChart
          weekly={insights.weekly}
          totalHours={metrics.hours.actual}
          avgHours={insights.weeklyAvgHours}
          peak={insights.weeklyPeak}
          monthName={monthName}
        />
        <TimeByProject
          projects={insights.byProject}
          currency={metrics.earnings.currency}
        />
        <DayComposition days={metrics.days} />
        <RecentEntries entries={insights.recent} onViewAll={onViewAllEntries} />
      </div>
    </section>
  )
}
