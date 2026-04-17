export interface WorkEntriesFilter {
  from?: string  // ISO date
  to?: string
  clientId?: string
  projectId?: string
}

/**
 * Centralne klucze zapytań TanStack Query.
 * Hierarchia umożliwia granularną inwalidację przez prefiks.
 *
 * @example
 * queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all() })      // wszystko
 * queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices() }) // tylko faktury
 */
export const QUERY_KEYS = {
  all:         () => ['dashboard-module']                    as const,
  dashboard:   () => [...QUERY_KEYS.all(), 'data']           as const,
  calendar:    () => [...QUERY_KEYS.all(), 'calendar']       as const,
  invoices:    () => [...QUERY_KEYS.all(), 'invoices']       as const,
  workEntries: (filter?: WorkEntriesFilter) =>
    [...QUERY_KEYS.all(), 'work-entries', filter ?? {}] as const,
  clients:     () => [...QUERY_KEYS.all(), 'clients']        as const,
  clientsData: () => [...QUERY_KEYS.all(), 'clients-data']   as const,
  clientRates: (clientId?: string) =>
    clientId
      ? [...QUERY_KEYS.all(), 'client-rates', clientId] as const
      : [...QUERY_KEYS.all(), 'client-rates']           as const,
  eurRate:     () => [...QUERY_KEYS.all(), 'eur-rate']       as const,
  projects:    () => [...QUERY_KEYS.all(), 'projects']       as const,
  projectsData:() => [...QUERY_KEYS.all(), 'projects-data']  as const,
} as const

export type QueryKey = ReturnType<(typeof QUERY_KEYS)[keyof typeof QUERY_KEYS]>