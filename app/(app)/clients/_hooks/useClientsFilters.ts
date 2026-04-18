'use client'

import { useCallback, useMemo } from 'react'
import {
  filterClientsByCurrency,
  filterClientsBySearch,
  filterClientsByWorkType,
  selectClientsWithStats,
  sortClients,
} from '../_domain/clients.selectors'
import type {
  ClientsCurrencyFilter,
  ClientsSortDirection,
  ClientsSortKey,
  ClientsWorkTypeFilter,
  ClientWithStats,
} from '../_domain/clients.types'
import type { Client, WorkEntry } from '@/lib/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface ClientsFiltersState {
  search:         string
  workTypeFilter: ClientsWorkTypeFilter
  currencyFilter: ClientsCurrencyFilter
  sortKey:        ClientsSortKey
  sortDirection:  ClientsSortDirection
}

const CLIENTS_FILTERS_STORAGE_KEY = 'clients-filters-v1'

const DEFAULT_FILTERS: ClientsFiltersState = {
  search:         '',
  workTypeFilter: 'all',
  currencyFilter: 'all',
  sortKey:        'name',
  sortDirection:  'asc',
}

const VALID_WORK_TYPE: ReadonlySet<ClientsWorkTypeFilter> = new Set(['all', 'hourly', 'piecework'])
const VALID_CURRENCY:  ReadonlySet<ClientsCurrencyFilter> = new Set(['all', 'PLN', 'EUR'])
const VALID_SORT_KEY:  ReadonlySet<ClientsSortKey> = new Set([
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

  const toggleSort = useCallback(
    (key: ClientsSortKey) => {
      setFilters((prev) =>
        prev.sortKey === key
          ? { ...prev, sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc' }
          : { ...prev, sortKey: key, sortDirection: 'asc' },
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
    return sortClients(byCurrency, filters.sortKey, filters.sortDirection)
  }, [
    withStats,
    filters.search,
    filters.workTypeFilter,
    filters.currencyFilter,
    filters.sortKey,
    filters.sortDirection,
  ])

  return {
    search:         filters.search,
    setSearch,
    workTypeFilter: filters.workTypeFilter,
    setWorkTypeFilter,
    currencyFilter: filters.currencyFilter,
    setCurrencyFilter,
    sortKey:        filters.sortKey,
    sortDirection:  filters.sortDirection,
    toggleSort,
    allWithStats:   withStats,
    visible,
  }
}
