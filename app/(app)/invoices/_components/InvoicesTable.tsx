'use client'

import { useMemo } from 'react'
import type { Client, Invoice } from '@/lib/types'
import { DataTable, type DataTableFilter } from '@/components/common/data-table'
import { createInvoiceColumns } from './columns'

interface InvoicesTableProps {
  invoices: Invoice[]
  clients: Client[]
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

export function InvoicesTable({ invoices, clients, onEdit, onDelete }: InvoicesTableProps) {
  const columns = useMemo(
    () => createInvoiceColumns({ clients, onEdit, onDelete }),
    [clients, onEdit, onDelete],
  )

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        columnId: 'payment_status',
        label: 'Status',
        type: 'chips',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Paid', value: 'paid' },
          { label: 'Unpaid', value: 'unpaid' },
        ],
      },
    ],
    [],
  )

  return (
    <DataTable
      data={invoices}
      columns={columns}
      filters={filters}
      searchPlaceholder="Search by ID, number, client, recipient..."
      emptyLabel="No invoices match the current filters."
      initialVisibility={{ billing_period: false }}
    />
  )
}
