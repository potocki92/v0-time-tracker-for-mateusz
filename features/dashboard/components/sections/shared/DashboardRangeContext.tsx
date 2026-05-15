'use client'

import { createContext, useContext } from 'react'
import {
  useDashboardFilters,
  type DashboardFilters,
} from '../../../hooks/useDashboardFilters'

const DashboardFiltersContext = createContext<DashboardFilters | null>(null)

/**
 * Cienki provider — wywołuje nuqs-owy hook raz na poziomie dashboardu
 * i rozdziela wynik przez context, żeby kilka sekcji nie subskrybowało
 * tych samych query params niezależnie.
 */
export function DashboardRangeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const filters = useDashboardFilters()
  return (
    <DashboardFiltersContext.Provider value={filters}>
      {children}
    </DashboardFiltersContext.Provider>
  )
}

export function useDashboardRange(): DashboardFilters {
  const ctx = useContext(DashboardFiltersContext)
  if (!ctx) {
    throw new Error('useDashboardRange must be used inside DashboardRangeProvider')
  }
  return ctx
}
