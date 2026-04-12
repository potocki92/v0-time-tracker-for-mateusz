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
  invoices:    () => [...QUERY_KEYS.all(), 'invoices']       as const,
  workEntries: () => [...QUERY_KEYS.all(), 'work-entries']   as const,
  clients:     () => [...QUERY_KEYS.all(), 'clients']        as const,
  eurRate:     () => [...QUERY_KEYS.all(), 'eur-rate']       as const,
} as const

export type QueryKey = ReturnType<(typeof QUERY_KEYS)[keyof typeof QUERY_KEYS]>