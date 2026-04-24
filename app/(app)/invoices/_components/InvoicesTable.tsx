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
}

export function InvoicesTable({ invoices, clients, onEdit, onDelete }: InvoicesTableProps) {
  const isMobile = useIsMobile()
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])

  const tableMeta = useMemo<InvoicesTableMeta>(
    () => ({ clientsById, onEdit, onDelete }),
    [clientsById, onDelete, onEdit],
  )

  const filters = useMemo<DataTableFilter[]>(
    () => [
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
    ],
    [],
  )

  if (isMobile) {
    return (
      <InvoicesMobileList
        invoices={invoices}
        clients={clients}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
  }

  return (
    <DataTable
      data={invoices}
      columns={columns}
      meta={tableMeta}
      filters={filters}
      storageKey={{ filters: 'invoices-table-filters-v2', layout: 'invoices-table-layout-v2' }}
      searchPlaceholder="Szukaj po numerze, kliencie lub okresie..."
      emptyLabel="Brak faktur spełniających kryteria."
      initialVisibility={{ billing_period: false }}
      enableColumnDnd
    />
  )
}
