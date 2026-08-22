'use client'

import { useMemo } from 'react'
import { getTodayLocalDateString } from '@/lib/helpers'
import { defaultMetricsSettings, toMetricsInput } from '@/lib/metrics/adapter'
import { computeMonthMetrics } from '@/lib/metrics/computeMonthMetrics'
import { monthPeriod } from '@/lib/metrics/period'
import type { MonthMetrics } from '@/lib/metrics/types'
import type { Client, WorkEntry } from '@/lib/types'

/**
 * Metryki miesiąca dla Kalendarza — ten sam silnik, z którego liczy Pulpit.
 *
 * Wpisy podajemy WSZYSTKIE, nie tylko miesięczne: `computeMonthMetrics` sam
 * tnie okno do agregatów, ale seria musi widzieć też koniec poprzedniego
 * miesiąca, żeby nie zerowała się 1. dnia.
 */
export function useMonthMetrics(
  workEntries: WorkEntry[],
  clients: Client[],
  eurRate: number,
  year: number,
  month: number,
): MonthMetrics {
  const today = getTodayLocalDateString()

  return useMemo(
    () =>
      computeMonthMetrics(
        toMetricsInput({
          period: monthPeriod(year, month),
          today,
          workEntries,
          clients,
          settings: defaultMetricsSettings(eurRate),
        }),
      ),
    [workEntries, clients, eurRate, year, month, today],
  )
}
