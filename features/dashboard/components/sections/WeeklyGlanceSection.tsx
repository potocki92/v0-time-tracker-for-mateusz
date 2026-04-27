'use client'

import { useDashboardData } from '../../hooks'
import { useEffectiveEurRate } from '../../hooks/usePreferencesStore'
import { EarningsChart } from '../chart'

/**
 * Wykres aktywności (godziny × zarobki) z dwuwymiarową kontrolką
 * grouping × period (dzień/tydzień/miesiąc/kwartał × tydzień/miesiąc/rok).
 * Stan przechowywany w URL (nuqs) — bookmarkowalny, niezależny od KPI.
 */
export function WeeklyGlanceSection() {
  const { data } = useDashboardData()
  const eurRate = useEffectiveEurRate()

  return (
    <EarningsChart
      workEntries={data.workEntries}
      clients={data.clients}
      eurToPlnRate={eurRate}
    />
  )
}
