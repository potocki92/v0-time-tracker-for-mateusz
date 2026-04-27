'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getDashboardData } from '../services/dashboard.service'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import type { DashboardData } from '../types/dashboard.types'

/**
 * Główny hook dashboardu — używa useSuspenseQuery.
 * `data` jest zawsze zdefiniowane — brak sprawdzania undefined w komponentach.
 * Suspense obsługuje loading w page.tsx przez <Suspense fallback={<DashboardSkeleton />}>.
 */
export function useDashboardData() {
  return useSuspenseQuery<DashboardData>({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn:  getDashboardData,
    ...QUERY_CONFIG.dashboard,
    retry: (failureCount, error) => {
      // Nie ponawiaj po rate limit — poczekaj na Retry-After
      if ((error as { code?: string }).code === 'RATE_LIMIT') return false
      return failureCount < 3
    },
    retryDelay: (_, error) => {
      if ((error as { code?: string }).code === 'RATE_LIMIT') return 60_000
      return 1_000
    },
  })
}