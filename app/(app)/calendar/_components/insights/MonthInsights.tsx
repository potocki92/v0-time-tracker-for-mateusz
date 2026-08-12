'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { CalendarInsights } from '../../_domain/calendar.types'
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
  insights: CalendarInsights
  onViewAllEntries?: () => void
}

/**
 * Sekcja "Month Insights" — kontener bento-grid 2-kolumnowego (desktop)
 * z wykresem słupkowym i 3 dodatkowymi widgetami w 2 rzędach.
 * Mobile: pojedyncza kolumna z naturalnym porządkiem od góry do dołu.
 */
export function MonthInsights({ monthName, insights, onViewAllEntries }: Props) {
  return (
    <section
      aria-labelledby="month-insights-heading"
      className="space-y-3 sm:space-y-4"
    >
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2
          id="month-insights-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
        >
          Podsumowanie miesiąca
        </h2>
        <span className="text-[10px] capitalize text-zinc-600">
          {monthName}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <HoursPerWeekChart
          weekly={insights.weekly}
          totalHours={insights.weeklyTotalHours}
          avgHours={insights.weeklyAvgHours}
          peak={insights.weeklyPeak}
          monthName={monthName}
        />
        <TimeByProject projects={insights.byProject} />
        <DayComposition composition={insights.composition} />
        <RecentEntries entries={insights.recent} onViewAll={onViewAllEntries} />
      </div>
    </section>
  )
}
