'use client'

import { useMemo } from 'react'
import type { Client, Invoice } from '@/lib/types'
import { DataTable, type DataTableFilter } from '@/components/common/data-table'
import { columns, type InvoicesTableMeta } from './columns'

interface InvoicesTableProps {
  invoices: Invoice[]
  clients: Client[]
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

export function InvoicesTable({ invoices, clients, onEdit, onDelete }: InvoicesTableProps) {
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
          { label: 'Opłacone', value: 'paid' },
          { label: 'Nieopłacone', value: 'unpaid' },
        ],
      },
    ],
    [],
  )

  return (
    <DataTable
      data={invoices}
      columns={columns}
      meta={tableMeta}
      filters={filters}
      storageKey={{ filters: 'invoices-table-filters-v1', layout: 'invoices-table-layout-v1' }}
      searchPlaceholder="Szukaj po ID, numerze, kliencie lub odbiorcy..."
      emptyLabel="Brak faktur spełniających kryteria."
      initialVisibility={{ billing_period: false }}
      enableColumnDnd
    />
  )
}
