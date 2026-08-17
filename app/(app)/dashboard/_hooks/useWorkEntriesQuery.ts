'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchWorkEntries } from '../_services/dashboard.fetchers'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import { WorkEntriesFilter } from '@/lib/query/queryKeys'

/**
 * Granularny hook dla wpisów pracy.
 * Używaj po dodaniu/edycji wpisu w kalendarzu —
 * invalidateQueries(QUERY_KEYS.workEntries()) odświeży tylko ten hook.
 *
 * @example
 * const { data: entries = [] } = useWorkEntriesQuery(userId)
 */
export function useWorkEntriesQuery(userId: string, filter?: WorkEntriesFilter) {
  return useQuery({
    queryKey: QUERY_KEYS.workEntries(filter),
    queryFn: () => fetchWorkEntries(userId, filter),
    enabled: Boolean(userId),
    ...QUERY_CONFIG.workEntries,
    placeholderData: (prev) => prev, // keepPreviousData podczas zmiany filtra
  })
}