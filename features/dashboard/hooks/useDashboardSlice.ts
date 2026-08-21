'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { dashboardQuery } from './dashboardQuery'
import type { DashboardData } from '../domain'

/**
 * Subskrypcja POJEDYNCZEGO pola DashboardData.
 *
 * useDashboardData() zwraca caly obiekt, wiec kazda zmiana referencji budzila
 * wszystkich 11 subskrybentow. Karta Faktur przerysowywala sie przy dodaniu
 * wpisu godzin, choc czyta wylacznie `invoices`.
 */
export function useDashboardSlice<T>(select: (data: DashboardData) => T): T {
  const { data } = useSuspenseQuery({ ...dashboardQuery, select })
  return data
}
