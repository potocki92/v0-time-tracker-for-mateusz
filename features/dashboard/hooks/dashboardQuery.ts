import { queryOptions } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS, fetchJson } from '@/lib/query'
import type { DashboardData } from '../domain'

/**
 * Jedna definicja zapytania dashboardu. Trzymana osobno, zeby useDashboardData
 * i useDashboardSlice nie rozjechaly sie konfiguracja retry — subtelna roznica
 * w retryDelay dawalaby dwa niezalezne wpisy zachowania na tym samym kluczu.
 */
export const dashboardQuery = queryOptions<DashboardData>({
  queryKey: QUERY_KEYS.dashboard(),
  queryFn: () => fetchJson<DashboardData>('/api/dashboard'),
  ...QUERY_CONFIG.dashboard,
  retry: (failureCount, error) => {
    // Nie ponawiaj po rate limit — poczekaj na Retry-After.
    if ((error as { code?: string }).code === 'RATE_LIMIT') return false
    return failureCount < 3
  },
  retryDelay: (_, error) => {
    if ((error as { code?: string }).code === 'RATE_LIMIT') return 60_000
    return 1_000
  },
})
