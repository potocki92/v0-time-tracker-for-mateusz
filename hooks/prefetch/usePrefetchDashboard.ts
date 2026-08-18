'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getDashboardData } from '@/features/dashboard'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UsePrefetchDashboardReturn {
  /**
   * Podpięty pod onMouseEnter / onFocus linka nawigacji.
   * Fire-and-forget — nie blokuje renderowania.
   */
  prefetchOnHover: () => void
  /**
   * Ręczne wywołanie z await (np. w testach lub przy route guard).
   */
  prefetch: () => Promise<void>
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Prefetchuje dane dashboardu gdy użytkownik najedzie na link nawigacji.
 * Gdy staleTime nie upłynął — brak dodatkowego fetcha (no-op).
 *
 * @example
 * const { prefetchOnHover } = usePrefetchDashboard()
 * <Link href="/dashboard" onMouseEnter={prefetchOnHover}>Dashboard</Link>
 */
export function usePrefetchDashboard(): UsePrefetchDashboardReturn {
  const queryClient = useQueryClient()

  const prefetch = useCallback(async (): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.dashboard(),
      queryFn:  getDashboardData,
      staleTime: QUERY_CONFIG.dashboard.staleTime,
    })
  }, [queryClient])

  const prefetchOnHover = useCallback((): void => {
    void prefetch()
  }, [prefetch])

  return { prefetchOnHover, prefetch }
}