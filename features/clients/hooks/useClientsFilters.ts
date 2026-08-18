'use client'

import { useCallback, useMemo } from 'react'
import {
  filterClientsByActivity,
  filterClientsByCurrency,
  filterClientsBySearch,
  filterClientsByWorkType,
  selectClientsWithStats,
  sortClients,
} from '../domain/clients.selectors'
import type {
  ClientsActivityFilter,
  ClientsCurrencyFilter,
  ClientsSortDirection,
  ClientsSortKey,
  ClientsWorkTypeFilter,
  ClientWithStats,
} from '../domain/clients.types'
import type { Client, WorkEntry } from '@/lib/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface ClientsFiltersState {
  search:         string
  workTypeFilter: ClientsWorkTypeFilter
  currencyFilter: ClientsCurrencyFilter
  activityFilter: ClientsActivityFilter
  sortKey:        ClientsSortKey
  sortDirection:  ClientsSortDirection
}

// v2: doszedł `activityFilter`, a domyślny sort zmienił się z name/asc na
// recent/desc. Bez podbicia klucza zapisany v1 nadpisałby nowy domyślny.
const CLIENTS_FILTERS_STORAGE_KEY = 'clients-filters-v2'

const DEFAULT_FILTERS: ClientsFiltersState = {
  search:         '',
  workTypeFilter: 'all',
  currencyFilter: 'all',
  activityFilter: 'all',
  sortKey:        'recent',
  sortDirection:  'desc',
}

const VALID_WORK_TYPE: ReadonlySet<ClientsWorkTypeFilter> = new Set(['all', 'hourly', 'piecework'])
const VALID_CURRENCY:  ReadonlySet<ClientsCurrencyFilter> = new Set(['all', 'PLN', 'EUR'])
const VALID_ACTIVITY:  ReadonlySet<ClientsActivityFilter> = new Set(['all', 'active', 'dormant', 'new'])
const VALID_SORT_KEY:  ReadonlySet<ClientsSortKey> = new Set([
  'recent',
  'name',
  'rate',
  'created_at',
  'earnings',
  'hours',
])
const VALID_SORT_DIR:  ReadonlySet<ClientsSortDirection> = new Set(['asc', 'desc'])

function isValidFilters(value: unknown): value is ClientsFiltersState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.search === 'string' &&
    typeof v.workTypeFilter === 'string' &&
    VALID_WORK_TYPE.has(v.workTypeFilter as ClientsWorkTypeFilter) &&
    typeof v.currencyFilter === 'string' &&
    VALID_CURRENCY.has(v.currencyFilter as ClientsCurrencyFilter) &&
    typeof v.activityFilter === 'string' &&
    VALID_ACTIVITY.has(v.activityFilter as ClientsActivityFilter) &&
    typeof v.sortKey === 'string' &&
    VALID_SORT_KEY.has(v.sortKey as ClientsSortKey) &&
    typeof v.sortDirection === 'string' &&
    VALID_SORT_DIR.has(v.sortDirection as ClientsSortDirection)
  )
}

/**
 * Lokalne filtry/sort dla tabeli Klienci. Stan trwały w localStorage,
 * żeby użytkownik nie tracił ustawień po odświeżeniu strony.
 */
export function useClientsFilters(
  clients: Client[],
  workEntries: WorkEntry[],
  rateHistoryByClient: Record<string, number>,
) {
  const [filters, setFilters] = useLocalStorage<ClientsFiltersState>(
    CLIENTS_FILTERS_STORAGE_KEY,
    DEFAULT_FILTERS,
    { validate: isValidFilters },
  )

  const setSearch = useCallback(
    (value: string) => setFilters((prev) => ({ ...prev, search: value })),
    [setFilters],
  )
  const setWorkTypeFilter = useCallback(
    (value: ClientsWorkTypeFilter) => setFilters((prev) => ({ ...prev, workTypeFilter: value })),
    [setFilters],
  )
  const setCurrencyFilter = useCallback(
    (value: ClientsCurrencyFilter) => setFilters((prev) => ({ ...prev, currencyFilter: value })),
    [setFilters],
  )
  const setActivityFilter = useCallback(
    (value: ClientsActivityFilter) => setFilters((prev) => ({ ...prev, activityFilter: value })),
    [setFilters],
  )
  const setSort = useCallback(
    (key: ClientsSortKey) =>
      setFilters((prev) => ({
        ...prev,
        sortKey: key,
        // Dla dat i kwot „najpierw największe" jest tym, czego się oczekuje;
        // dla nazwy — A-Z.
        sortDirection: key === 'name' ? 'asc' : 'desc',
      })),
    [setFilters],
  )

  const toggleSort = useCallback(
    (key: ClientsSortKey) => {
      setFilters((prev) =>
        prev.sortKey === key
          ? { ...prev, sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc' }
          : { ...prev, sortKey: key, sortDirection: key === 'name' ? 'asc' : 'desc' },
      )
    },
    [setFilters],
  )

  const withStats: ClientWithStats[] = useMemo(
    () => selectClientsWithStats(clients, workEntries, rateHistoryByClient),
    [clients, workEntries, rateHistoryByClient],
  )

  const visible = useMemo(() => {
    const bySearch   = filterClientsBySearch(withStats, filters.search)
    const byWorkType = filterClientsByWorkType(bySearch, filters.workTypeFilter)
    const byCurrency = filterClientsByCurrency(byWorkType, filters.currencyFilter)
    const byActivity = filterClientsByActivity(byCurrency, filters.activityFilter)
    return sortClients(byActivity, filters.sortKey, filters.sortDirection)
  }, [
    withStats,
    filters.search,
    filters.workTypeFilter,
    filters.currencyFilter,
    filters.activityFilter,
    filters.sortKey,
    filters.sortDirection,
  ])

  /** Ile wymiarów zawęża listę — do licznika na przycisku „Filtruj". */
  const activeFilterCount =
    (filters.workTypeFilter !== 'all' ? 1 : 0) +
    (filters.currencyFilter !== 'all' ? 1 : 0) +
    (filters.activityFilter !== 'all' ? 1 : 0)

  return {
    search:         filters.search,
    setSearch,
    workTypeFilter: filters.workTypeFilter,
    setWorkTypeFilter,
    currencyFilter: filters.currencyFilter,
    setCurrencyFilter,
    activityFilter: filters.activityFilter,
    setActivityFilter,
    sortKey:        filters.sortKey,
    sortDirection:  filters.sortDirection,
    setSort,
    toggleSort,
    activeFilterCount,
    allWithStats:   withStats,
    visible,
  }
}
