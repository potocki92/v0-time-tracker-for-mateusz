'use client'

import { useCallback, useMemo } from 'react'
import type { Invoice } from '@/lib/types'
import type { InvoiceStatusFilter } from '../_domain'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface InvoicesFiltersState {
  query:  string
  status: InvoiceStatusFilter
}

const INVOICES_FILTERS_STORAGE_KEY = 'invoices-filters-v1'

const DEFAULT_FILTERS: InvoicesFiltersState = {
  query:  '',
  status: 'all',
}

const VALID_STATUS: ReadonlySet<InvoiceStatusFilter> = new Set(['all', 'paid', 'unpaid'])

function isValidFilters(value: unknown): value is InvoicesFiltersState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.query === 'string' &&
    typeof v.status === 'string' &&
    VALID_STATUS.has(v.status as InvoiceStatusFilter)
  )
}

export function useInvoicesFilters(invoices: Invoice[]) {
  const [filters, setFilters] = useLocalStorage<InvoicesFiltersState>(
    INVOICES_FILTERS_STORAGE_KEY,
    DEFAULT_FILTERS,
    { validate: isValidFilters },
  )

  const setQuery = useCallback(
    (value: string) => setFilters((prev) => ({ ...prev, query: value })),
    [setFilters],
  )

  const setStatus = useCallback(
    (value: InvoiceStatusFilter) => setFilters((prev) => ({ ...prev, status: value })),
    [setFilters],
  )

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase()

    return invoices.filter((invoice) => {
      const matchesStatus =
        filters.status === 'all' ||
        (filters.status === 'paid' && invoice.is_paid) ||
        (filters.status === 'unpaid' && !invoice.is_paid)

      if (!matchesStatus) return false
      if (!normalizedQuery) return true

      return [invoice.id, invoice.name, invoice.invoice_number, invoice.recipient]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery))
    })
  }, [invoices, filters.query, filters.status])

  return {
    query:  filters.query,
    status: filters.status,
    setQuery,
    setStatus,
    filteredInvoices,
  }
}
