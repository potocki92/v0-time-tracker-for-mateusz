'use client'

import { useMemo, useState } from 'react'
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

/**
 * Lokalne filtry/sort dla tabeli Klienci. Trzymamy state na poziomie hooka,
 * żeby ClientsContent pozostał cienki. Jeżeli w przyszłości pojawi się
 * persystencja — podmień useState na zustand bez zmian API.
 */
export function useClientsFilters(
  clients: Client[],
  workEntries: WorkEntry[],
  rateHistoryByClient: Record<string, number>,
) {
  const [search, setSearch]                 = useState('')
  const [workTypeFilter, setWorkTypeFilter] = useState<ClientsWorkTypeFilter>('all')
  const [currencyFilter, setCurrencyFilter] = useState<ClientsCurrencyFilter>('all')
  const [sortKey, setSortKey]               = useState<ClientsSortKey>('name')
  const [sortDirection, setSortDirection]   = useState<ClientsSortDirection>('asc')

  const withStats: ClientWithStats[] = useMemo(
    () => selectClientsWithStats(clients, workEntries, rateHistoryByClient),
    [clients, workEntries, rateHistoryByClient],
  )

  const visible = useMemo(() => {
    const bySearch   = filterClientsBySearch(withStats, search)
    const byWorkType = filterClientsByWorkType(bySearch, workTypeFilter)
    const byCurrency = filterClientsByCurrency(byWorkType, currencyFilter)
    return sortClients(byCurrency, sortKey, sortDirection)
  }, [withStats, search, workTypeFilter, currencyFilter, sortKey, sortDirection])

  function toggleSort(key: ClientsSortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return {
    search,
    setSearch,
    workTypeFilter,
    setWorkTypeFilter,
    currencyFilter,
    setCurrencyFilter,
    sortKey,
    sortDirection,
    toggleSort,
    allWithStats: withStats,
    visible,
  }
}
