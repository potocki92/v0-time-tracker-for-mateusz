'use client'

import { useMemo } from 'react'
import { computeActiveStreak } from '@/lib/date/streak'
import { targetHoursForRange } from '@/lib/date/business-days'
import { ChartErrorBoundary } from '../../errors'
import { HoursCard } from './HoursCard'
import { useDashboardRange } from '../shared/DashboardRangeContext'
import { useDashboardDerived } from '../shared/DashboardDerivedContext'

function periodShort(label: string): string {
  return label.split(' ').slice(-1)[0] ?? label
}

export function HoursSection() {
  const { dateRange } = useDashboardRange()
  const { realizedAll, totals, predictedTotals, periodLabel } =
    useDashboardDerived()

  // Cel liczy się z dni roboczych zakresu, a nie ze stałej mapy `range -> h`:
  // ta dawała 160 h zarówno lutemu, jak i lipcowi, i pełne 40 h trwającemu
  // tygodniowi już w poniedziałek, przez co „Cel osiągnięty" zapalał się losowo.
  const target = useMemo(
    () => targetHoursForRange(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to],
  )

  // Heatmapa i seria patrzą na CAŁĄ historię, nie na zakres: przy zakresie
  // „bieżący tydzień" siatka 13 tygodni pokazywałaby jeden zapełniony tydzień
  // i dwanaście pustych, choć dane są.
  const streak = useMemo(() => computeActiveStreak(realizedAll), [realizedAll])

  return (
    <ChartErrorBoundary>
      <HoursCard
        totalHours={totals.totalHours}
        totalDays={totals.totalDays}
        targetHours={target}
        periodLabel={periodShort(periodLabel) || 'okres'}
        entries={realizedAll}
        streakDays={streak.current}
      />
      {predictedTotals.totalHours > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Przewidywane godziny:{' '}
          <span className="font-medium text-foreground">
            {predictedTotals.totalHours.toFixed(1)} h
          </span>
        </p>
      )}
    </ChartErrorBoundary>
  )
}
