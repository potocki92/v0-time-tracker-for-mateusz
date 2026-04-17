import type { CalendarStats as CalendarStatsData } from '../../_domain/calendar.types'
import { DaysCard } from './DaysCard'
import { ForecastCard } from './ForecastCard'
import { HoursCard } from './HoursCard'

/**
 * Agregat trzech kart statystyk miesiąca. Mobile: stack 2-kolumnowy (hours+forecast),
 * dni pod spodem w pełnej szerokości. Desktop: 3 kolumny.
 */
export function CalendarStats(props: CalendarStatsData) {
  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3">
      <HoursCard
        totalHours={props.totalHours}
        baselineHours={props.baselineHours}
        progressPercent={props.progressPercent}
        isAhead={props.isAhead}
      />
      <ForecastCard forecastPLN={props.forecastPLN} />
      <div className="col-span-2 sm:col-span-1">
        <DaysCard workDays={props.workDays} freeDays={props.freeDays} />
      </div>
    </div>
  )
}
