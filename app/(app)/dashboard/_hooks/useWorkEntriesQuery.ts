'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchWorkEntries } from '../_services/dashboard.fetchers'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import type { WorkEntry } from '@/lib/types'

/**
 * Granularny hook dla wpisów pracy.
 * Używaj po dodaniu/edycji wpisu w kalendarzu —
 * invalidateQueries(QUERY_KEYS.workEntries()) odświeży tylko ten hook.
 *
 * @example
 * const { data: entries = [] } = useWorkEntriesQuery(userId)
 */
export function useWorkEntriesQuery(userId: string): UseQueryResult<WorkEntry[]> {
  return useQuery<WorkEntry[]>({
    queryKey: QUERY_KEYS.workEntries(),
    queryFn:  () => fetchWorkEntries(userId),
    enabled:  Boolean(userId),
    ...QUERY_CONFIG.workEntries,
  })
}