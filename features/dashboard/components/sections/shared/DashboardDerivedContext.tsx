'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { getTodayLocalDateString } from '@/lib/helpers'
import { computeDashboardDerived, type DashboardDerived } from '../../../lib/derived'
import { useDashboardData } from '../../../hooks/useDashboardData'
import { useEffectiveEurRate } from '../../../hooks/usePreferencesStore'
import { useDashboardRange } from './DashboardRangeContext'

const DashboardDerivedContext = createContext<DashboardDerived | null>(null)

/**
 * Liczy pochodne dashboardu RAZ i rozdaje przez context.
 *
 * Wczesniej szesc sekcji wolalo useFilteredEntries / useRealizedEntries /
 * useDashboardTotals niezaleznie. Kazda miala wlasny useMemo, wiec przy jednej
 * zmianie zakresu ten sam filtr O(N) lecial siedem razy.
 */
export function DashboardDerivedProvider({ children }: { children: ReactNode }) {
  const { data } = useDashboardData()
  const { range, dateRange, prevRange } = useDashboardRange()
  const eurRate = useEffectiveEurRate()

  // String, wiec porownanie w deps jest po wartosci — memo trzyma przez caly
  // dzien i unwazni sie samo po polnocy. Poprzednia wersja liczyla to wewnatrz
  // useMemo bez deps, wiec dashboard otwarty przez polnoc pokazywal wczorajszy
  // podzial na zrealizowane i planowane.
  const todayIso = getTodayLocalDateString()

  const value = useMemo(
    () =>
      computeDashboardDerived({
        workEntries: data.workEntries,
        clients: data.clients,
        dateRange,
        prevRange,
        range,
        eurRate,
        todayIso,
      }),
    [data.workEntries, data.clients, dateRange, prevRange, range, eurRate, todayIso],
  )

  return (
    <DashboardDerivedContext.Provider value={value}>
      {children}
    </DashboardDerivedContext.Provider>
  )
}

export function useDashboardDerived(): DashboardDerived {
  const ctx = useContext(DashboardDerivedContext)
  if (!ctx) {
    throw new Error('useDashboardDerived must be used inside DashboardDerivedProvider')
  }
  return ctx
}
