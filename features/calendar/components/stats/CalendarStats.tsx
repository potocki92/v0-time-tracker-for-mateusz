import type { MonthMetrics } from '@/lib/metrics/types'
import { ActiveStreakCard } from './ActiveStreakCard'
import { DaysCard } from './DaysCard'
import { HoursCard } from './HoursCard'
import { PredictedEarningsCard } from './PredictedEarningsCard'
import { RealizedEarningsCard } from './RealizedEarningsCard'
import { toMajorUnits } from './format'

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
    earnings.forecastMinor > 0
      ? Math.round((earnings.actualMinor / earnings.forecastMinor) * 100)
      : 0

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
      <HoursCard
        totalHours={hours.actual}
        goalHours={hours.goal}
        progressPercent={hours.goalProgress * 100}
        isAhead={hours.goalProgress >= 1}
      />
      <RealizedEarningsCard
        realizedEarnings={toMajorUnits(earnings.actualMinor)}
        realizedHours={hours.actual}
        realizedDays={metrics.realizedWorkedDays}
        currency={earnings.currency}
      />
      <PredictedEarningsCard
        forecastEarnings={toMajorUnits(earnings.forecastMinor)}
        realizedEarnings={toMajorUnits(earnings.actualMinor)}
        plannedEarnings={toMajorUnits(earnings.plannedMinor)}
        plannedHours={hours.planned}
        plannedDays={metrics.plannedDays}
        realizedSharePercent={realizedShare}
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
