'use client'

import type { CalendarInsights } from '../../_domain/calendar.types'
import { DayComposition } from './DayComposition'
import { HoursPerWeekChart } from './HoursPerWeekChart'
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
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          Podsumowanie miesiąca
        </h2>
        <span className="text-[10px] capitalize text-muted-foreground/70">
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
