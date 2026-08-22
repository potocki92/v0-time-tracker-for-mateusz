import type { MonthMetrics } from '@/lib/metrics/types'
import { ActiveStreakCard } from './ActiveStreakCard'
import { DaysCard } from './DaysCard'
import { HoursCard } from './HoursCard'
import { PredictedEarningsCard } from './PredictedEarningsCard'
import { RealizedEarningsCard } from './RealizedEarningsCard'

interface Props {
  metrics: MonthMetrics
}

/**
 * Bento-grid z 5 KPI-kartami.
 *
 * Karty nie liczą już niczego samodzielnie — to jedyne miejsce, w którym
 * `MonthMetrics` zamienia się w propsy, więc Kalendarz i Pulpit nie mogą się
 * rozjechać na liczbach.
 */
export function CalendarStats({ metrics }: Props) {
  const { hours, earnings, days } = metrics
  const realizedShare =
    earnings.forecastMinor > 0 ? earnings.actualMinor / earnings.forecastMinor : 0

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
      <HoursCard
        totalHours={hours.actual}
        goalHours={hours.goal}
        goalProgress={hours.goalProgress}
        isAhead={hours.goalProgress >= 1}
      />
      <RealizedEarningsCard
        realizedEarningsMinor={earnings.actualMinor}
        realizedHours={hours.actual}
        realizedDays={metrics.realizedWorkedDays}
        currency={earnings.currency}
      />
      <PredictedEarningsCard
        forecastEarningsMinor={earnings.forecastMinor}
        realizedEarningsMinor={earnings.actualMinor}
        plannedEarningsMinor={earnings.plannedMinor}
        plannedHours={hours.planned}
        plannedDays={metrics.plannedDays}
        realizedShare={realizedShare}
        currency={earnings.currency}
      />
      <DaysCard
        workDays={days.worked}
        freeDays={days.vacation + days.sick + days.dayOff}
      />
      <ActiveStreakCard
        current={metrics.currentStreakDays}
        longest={metrics.longestStreakDays}
      />
    </div>
  )
}
