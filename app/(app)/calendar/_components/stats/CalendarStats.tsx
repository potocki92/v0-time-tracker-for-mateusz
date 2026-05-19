import type { CalendarStats as CalendarStatsData } from '../../_domain/calendar.types'
import { ActiveStreakCard } from './ActiveStreakCard'
import { DaysCard } from './DaysCard'
import { ForecastCard } from './ForecastCard'
import { HoursCard } from './HoursCard'
import { PredictedEarningsCard } from './PredictedEarningsCard'

interface Props extends CalendarStatsData {
  streakCurrent: number
  streakLongest: number
}

/**
 * Bento-grid z 4 KPI-kartami. Mobile: 2×2, desktop: 4×1.
 */
export function CalendarStats({
  totalHours,
  forecastPLN,
  predictedEarningsPLN,
  realizedEarningsPLN,
  workDays,
  freeDays,
  progressPercent,
  baselineHours,
  isAhead,
  streakCurrent,
  streakLongest,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
      <HoursCard
        totalHours={totalHours}
        baselineHours={baselineHours}
        progressPercent={progressPercent}
        isAhead={isAhead}
      />
      <ForecastCard forecastPLN={forecastPLN} workDays={workDays} />
      <PredictedEarningsCard
        predictedEarningsPLN={predictedEarningsPLN}
        realizedEarningsPLN={realizedEarningsPLN}
      />
      <DaysCard workDays={workDays} freeDays={freeDays} />
      <ActiveStreakCard current={streakCurrent} longestThisYear={streakLongest} />
    </div>
  )
}
