'use client'

import { ChartErrorBoundary } from '../../errors'
import { HoursCard } from './HoursCard'
import { useDashboardDerived } from '../shared/DashboardDerivedContext'

function periodShort(label: string): string {
  return label.split(' ').slice(-1)[0] ?? label
}

export function HoursSection() {
  const { realizedAll, periodLabel, metrics } = useDashboardDerived()
  const { hours } = metrics

  return (
    <ChartErrorBoundary>
      <HoursCard
        totalHours={hours.actual}
        avgPerDay={hours.avgPerWorkedDay}
        targetHours={hours.goal > 0 ? hours.goal : null}
        goalProgress={hours.goalProgress}
        overtime={hours.overtime}
        periodLabel={periodShort(periodLabel) || 'okres'}
        // Heatmapa patrzy na CALA historie, nie na zakres: przy zakresie
        // „biezacy tydzien" siatka 13 tygodni pokazywalaby jeden zapelniony
        // tydzien i dwanascie pustych, choc dane sa.
        entries={realizedAll}
        streakDays={metrics.currentStreakDays}
      />
      {hours.planned > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Przewidywane godziny:{' '}
          <span className="font-medium text-foreground">
            {hours.planned.toFixed(1)} h
          </span>
        </p>
      )}
    </ChartErrorBoundary>
  )
}
