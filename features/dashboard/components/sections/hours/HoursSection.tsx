'use client'

import { useFormat } from '@/lib/format/client'
import { ChartErrorBoundary } from '../../errors'
import { HoursCard } from './HoursCard'
import { useDashboardDerived } from '../shared/DashboardDerivedContext'

export function HoursSection() {
  const fmt = useFormat()
  const { metrics } = useDashboardDerived()
  const { hours } = metrics

  return (
    <ChartErrorBoundary>
      <HoursCard
        totalHours={hours.actual}
        avgPerDay={hours.avgPerWorkedDay}
        targetHours={hours.goal > 0 ? hours.goal : null}
        goalProgress={hours.goalProgress}
        overtime={hours.overtime}
        streakDays={metrics.currentStreakDays}
      />
      {hours.planned > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Przewidywane godziny:{' '}
          <span className="font-medium text-foreground">
            {fmt.hours(hours.planned)}
          </span>
        </p>
      )}
    </ChartErrorBoundary>
  )
}
