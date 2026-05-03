'use client'

import { useMemo } from 'react'
import type { Client, Invoice } from '@/lib/types'
import { DataTable, type DataTableFilter } from '@/components/common/data-table'
import { useIsMobile } from '@/hooks/use-mobile'
import { INVOICE_STATUS_LABELS_PL, InvoiceStatus } from '@/lib/finance/invoice-status'
import { columns, type InvoicesTableMeta } from './columns'
import { InvoicesMobileList } from './InvoicesMobileList'

interface InvoicesTableProps {
  invoices: Invoice[]
  clients: Client[]
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
  onTogglePaid: (invoice: Invoice) => void
  onBulkDelete?: (invoices: Invoice[]) => void
  onCreate?: () => void
}

const NO_CLIENT_VALUE = '__none__'

export function InvoicesTable({
  invoices,
  clients,
  onEdit,
  onDelete,
  onTogglePaid,
  onBulkDelete,
  onCreate,
}: InvoicesTableProps) {
  const isMobile = useIsMobile()
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])

  const tableMeta = useMemo<InvoicesTableMeta>(
    () => ({ clientsById, onEdit, onDelete, onTogglePaid }),
    [clientsById, onDelete, onEdit, onTogglePaid],
  )

  // Surface only currencies that actually appear in the dataset so the
  // filter chip group never offers an option that yields zero results.
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>()
    for (const invoice of invoices) {
      if (invoice.currency) set.add(invoice.currency)
    }
    return Array.from(set).sort()
  }, [invoices])

  const filters = useMemo<DataTableFilter[]>(() => {
    const list: DataTableFilter[] = [
      {
        columnId: 'payment_status',
        label: 'Status',
        type: 'chips',
        options: [
          { label: 'Wszystkie', value: 'all' },
          { label: INVOICE_STATUS_LABELS_PL.DRAFT, value: InvoiceStatus.DRAFT },
          { label: INVOICE_STATUS_LABELS_PL.SENT, value: InvoiceStatus.SENT },
          { label: INVOICE_STATUS_LABELS_PL.PAID, value: InvoiceStatus.PAID },
          { label: INVOICE_STATUS_LABELS_PL.OVERDUE, value: InvoiceStatus.OVERDUE },
          { label: INVOICE_STATUS_LABELS_PL.CANCELLED, value: InvoiceStatus.CANCELLED },
        ],
      },
      {
        columnId: 'client',
        label: 'Klient',
        type: 'select',
        allLabel: 'Wszyscy klienci',
        options: [
          ...clients
            .map((client) => ({ label: client.name, value: client.id }))
            .sort((a, b) => a.label.localeCompare(b.label, 'pl')),
          { label: 'Bez klienta', value: NO_CLIENT_VALUE },
        ],
      },
      {
        columnId: 'invoice_date',
        label: 'Okres wystawienia',
        type: 'dateRange',
      },
      {
        columnId: 'amount',
        label: 'Kwota',
        type: 'numberRange',
        step: 0.01,
        minPlaceholder: 'od',
        maxPlaceholder: 'do',
      },
    ]

    if (availableCurrencies.length > 1) {
      list.push({
        columnId: 'currency',
        label: 'Waluta',
        type: 'chips',
        options: [
          { label: 'Wszystkie', value: 'all' },
          ...availableCurrencies.map((value) => ({ label: value, value })),
        ],
      })
    }

    return list
  }, [availableCurrencies, clients])

  if (isMobile) {
    return (
      <InvoicesMobileList
        invoices={invoices}
        clients={clients}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePaid={onTogglePaid}
      />
    )
  }

  return (
    <DataTable
      data={invoices}
      columns={columns}
      meta={tableMeta}
      filters={filters}
      storageKey={{ filters: 'invoices-table-filters-v3', layout: 'invoices-table-layout-v2' }}
      urlStateKey="inv"
      onAddRow={onCreate}
      onDeleteRows={onBulkDelete ? (rows) => onBulkDelete(rows) : undefined}
      searchPlaceholder="Szukaj po numerze, kliencie lub okresie..."
      emptyLabel="Brak faktur spełniających kryteria."
      initialVisibility={{ billing_period: false, currency: false }}
      enableColumnDnd
    />
  )
}
