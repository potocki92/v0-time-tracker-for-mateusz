'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { dashboardQuery } from './dashboardQuery'

/**
 * Główny hook dashboardu — używa useSuspenseQuery.
 * `data` jest zawsze zdefiniowane — brak sprawdzania undefined w komponentach.
 * Suspense obsługuje loading w page.tsx przez <Suspense fallback={<DashboardSkeleton />}>.
 *
 * Zwraca CAŁY obiekt, więc budzi się przy każdej zmianie referencji danych.
 * Sekcje dashboardu czytają pojedyncze pola przez `useDashboardSlice`.
 */
export function useDashboardData() {
  return useSuspenseQuery(dashboardQuery)
}
