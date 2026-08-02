'use client'

import { useCallback } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { CURRENCY } from '@/lib/types'
import type { InvoiceFilterTab } from '../domain/stats'

interface InvoicesFiltersState {
  activeTab: InvoiceFilterTab
  query:     string
  pageSize:  number
  currency:  CURRENCY
}

const INVOICES_FILTERS_STORAGE_KEY = 'invoices-filters-v1'

const DEFAULT_FILTERS: InvoicesFiltersState = {
  activeTab: 'all',
  query:     '',
  pageSize:  10,
  currency:  'PLN',
}

const VALID_TABS: ReadonlySet<InvoiceFilterTab> = new Set([
  'all',
  'open',
  'overdue',
  'paid',
  'drafts',
])

const VALID_PAGE_SIZES: ReadonlySet<number> = new Set([10, 25, 50, 100])

const VALID_CURRENCIES: ReadonlySet<CURRENCY> = new Set(['PLN', 'EUR'])

function isValidFilters(value: unknown): value is InvoicesFiltersState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.activeTab === 'string' &&
    VALID_TABS.has(v.activeTab as InvoiceFilterTab) &&
    typeof v.query === 'string' &&
    typeof v.pageSize === 'number' &&
    VALID_PAGE_SIZES.has(v.pageSize) &&
    typeof v.currency === 'string' &&
    VALID_CURRENCIES.has(v.currency as CURRENCY)
  )
}

/**
 * Trwały filtr listy faktur (zakładka statusu, fraza wyszukiwania, rozmiar
 * strony) — zapisany w localStorage, żeby ustawienia przeżywały odświeżenie
 * i nawigację. Strona aktywna celowo NIE jest persistowana — po zmianie
 * filtra/zapytania i tak wracamy do strony 1.
 */
export function useInvoicesFilters() {
  const [filters, setFilters] = useLocalStorage<InvoicesFiltersState>(
    INVOICES_FILTERS_STORAGE_KEY,
    DEFAULT_FILTERS,
    { validate: isValidFilters },
  )

  const setActiveTab = useCallback(
    (value: InvoiceFilterTab) =>
      setFilters((prev) => ({ ...prev, activeTab: value })),
    [setFilters],
  )

  const setQuery = useCallback(
    (value: string) => setFilters((prev) => ({ ...prev, query: value })),
    [setFilters],
  )

  const setPageSize = useCallback(
    (value: number) => setFilters((prev) => ({ ...prev, pageSize: value })),
    [setFilters],
  )

  const setCurrency = useCallback(
    (value: CURRENCY) => setFilters((prev) => ({ ...prev, currency: value })),
    [setFilters],
  )

  return {
    activeTab: filters.activeTab,
    setActiveTab,
    query:     filters.query,
    setQuery,
    pageSize:  filters.pageSize,
    setPageSize,
    currency:  filters.currency,
    setCurrency,
  }
}
