'use client'

import { formatHours } from '@/lib/format'
import { ChartErrorBoundary } from '../../errors'
import { HoursCard } from './HoursCard'
import { useDashboardDerived } from '../shared/DashboardDerivedContext'

export function HoursSection() {
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
            {formatHours(hours.planned)}
          </span>
        </p>
      )}
    </ChartErrorBoundary>
  )
}
