import type { CalendarStats as CalendarStatsData } from '../../domain/calendar.types'
import { ActiveStreakCard } from './ActiveStreakCard'
import { DaysCard } from './DaysCard'
import { HoursCard } from './HoursCard'
import { PredictedEarningsCard } from './PredictedEarningsCard'
import { RealizedEarningsCard } from './RealizedEarningsCard'

interface Props extends CalendarStatsData {
  streakCurrent: number
  streakLongest: number
}

/**
 * Bento-grid z 5 KPI-kartami. Mobile: 2 kolumny, desktop: 5×1.
 */
export function CalendarStats({
  totalHours,
  realizedHours,
  predictedHours,
  totalEarningsPLN,
  predictedEarningsPLN,
  realizedEarningsPLN,
  realizedSharePercent,
  workDays,
  realizedDays,
  predictedDays,
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
      <RealizedEarningsCard
        realizedEarningsPLN={realizedEarningsPLN}
        realizedHours={realizedHours}
        realizedDays={realizedDays}
      />
      <PredictedEarningsCard
        totalEarningsPLN={totalEarningsPLN}
        realizedEarningsPLN={realizedEarningsPLN}
        predictedEarningsPLN={predictedEarningsPLN}
        predictedHours={predictedHours}
        predictedDays={predictedDays}
        realizedSharePercent={realizedSharePercent}
      />
      <DaysCard workDays={workDays} freeDays={freeDays} />
      <ActiveStreakCard current={streakCurrent} longestThisYear={streakLongest} />
    </div>
  )
}
