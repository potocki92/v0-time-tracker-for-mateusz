'use client'

import { useMemo, useState } from 'react'
import type { Invoice } from '@/lib/types'
import type { InvoiceStatusFilter } from '../_domain'

export function useInvoicesFilters(invoices: Invoice[]) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<InvoiceStatusFilter>('all')

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return invoices.filter((invoice) => {
      const matchesStatus =
        status === 'all' ||
        (status === 'paid' && invoice.is_paid) ||
        (status === 'unpaid' && !invoice.is_paid)

      if (!matchesStatus) return false
      if (!normalizedQuery) return true

      return [invoice.id, invoice.name, invoice.invoice_number, invoice.recipient]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery))
    })
  }, [invoices, query, status])

  return {
    query,
    status,
    setQuery,
    setStatus,
    filteredInvoices,
  }
}
