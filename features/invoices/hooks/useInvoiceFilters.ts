'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { InvoiceStatus } from '@/lib/finance/invoice-status'

export type InvoiceStatusFilter = 'all' | InvoiceStatus

export interface InvoiceFilters {
  status: InvoiceStatusFilter
  dateRange: {
    from: string | null
    to: string | null
  }
  searchPhrase: string
}

interface InvoiceFiltersState {
  filters: InvoiceFilters
  setFilters: (next: Partial<InvoiceFilters>) => void
  setStatus: (status: InvoiceStatusFilter) => void
  setDateRange: (dateRange: InvoiceFilters['dateRange']) => void
  setSearchPhrase: (searchPhrase: string) => void
  resetFilters: () => void
}

export const DEFAULT_INVOICE_FILTERS: InvoiceFilters = {
  status: 'all',
  dateRange: {
    from: null,
    to: null,
  },
  searchPhrase: '',
}

export const useInvoiceFiltersStore = create<InvoiceFiltersState>()(
  persist(
    (set) => ({
      filters: DEFAULT_INVOICE_FILTERS,
      setFilters: (next) =>
        set((state) => ({
          filters: {
            ...state.filters,
            ...next,
            dateRange: {
              ...state.filters.dateRange,
              ...(next.dateRange ?? {}),
            },
            searchPhrase: next.searchPhrase ?? state.filters.searchPhrase,
            status: next.status ?? state.filters.status,
          },
        })),
      setStatus: (status) =>
        set((state) => ({
          filters: {
            ...state.filters,
            status,
          },
        })),
      setDateRange: (dateRange) =>
        set((state) => ({
          filters: {
            ...state.filters,
            dateRange,
          },
        })),
      setSearchPhrase: (searchPhrase) =>
        set((state) => ({
          filters: {
            ...state.filters,
            searchPhrase,
          },
        })),
      resetFilters: () => set({ filters: DEFAULT_INVOICE_FILTERS }),
    }),
    {
      name: 'invoice-filters-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ filters: state.filters }),
    },
  ),
)

export const useInvoiceFilters = () => useInvoiceFiltersStore((state) => state.filters)
export const useSetInvoiceFilters = () => useInvoiceFiltersStore((state) => state.setFilters)
export const useResetInvoiceFilters = () => useInvoiceFiltersStore((state) => state.resetFilters)
