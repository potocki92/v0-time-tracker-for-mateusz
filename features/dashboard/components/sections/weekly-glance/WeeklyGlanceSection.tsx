'use client'

import { useDashboardSlice } from '../../../hooks/useDashboardSlice'
import {
  selectClients,
  selectWorkEntries,
} from '../../../hooks/dashboardSelectors'
import { useEffectiveEurRate } from '../../../hooks/usePreferencesStore'
import { EarningsChart } from '../../chart/EarningsChart'

/**
 * Wykres aktywności (godziny × zarobki) z dwuwymiarową kontrolką
 * grouping × period (dzień/tydzień/miesiąc/kwartał × tydzień/miesiąc/rok).
 * Stan przechowywany w URL (nuqs) — bookmarkowalny, niezależny od KPI.
 */
export function WeeklyGlanceSection() {
  const workEntries = useDashboardSlice(selectWorkEntries)
  const clients = useDashboardSlice(selectClients)
  const eurRate = useEffectiveEurRate()

  return (
    <EarningsChart
      workEntries={workEntries}
      clients={clients}
      eurToPlnRate={eurRate}
    />
  )
}
