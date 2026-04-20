'use client'

import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Column, ColumnDef } from '@tanstack/react-table'
import type { Client, Invoice } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientDisplay } from '@/components/common/ClientDisplay'

export interface InvoicesTableMeta {
  clientsById: Map<string, Client>
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

function formatInvoiceDate(date: string | null | undefined) {
  if (!date) return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

function SortableHeader({ column, label }: { column: Column<Invoice, unknown>; label: string }) {
  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      className="h-auto p-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-1 size-3" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-1 size-3" />
      ) : (
        <ArrowUpDown className="ml-1 size-3 opacity-50" />
      )}
    </Button>
  )
}

function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: 'select',
    enableHiding: false,
    enableSorting: false,
    enableResizing: false,
    size: 42,
    minSize: 42,
    maxSize: 42,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        aria-label="Select row"
      />
    ),
  }
}

export const COLUMN_LABELS: Record<string, string> = {
  select: 'Zaznacz',
  invoice_number: 'ID',
  client: 'Klient',
  invoice_date: 'Data',
  billing_period: 'Kwartał',
  payment_status: 'Status',
  amount: 'Kwota',
  actions: 'Akcje',
}

export const columns: ColumnDef<Invoice>[] = [
  createSelectionColumn<Invoice>(),
  {
    id: 'invoice_number',
    accessorFn: (row) => row.invoice_number ?? row.id.slice(0, 8),
    header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.invoice_number} />,
    meta: { label: 'ID' },
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.invoice_number || row.original.id.slice(0, 8)}
      </span>
    ),
    size: 140,
    minSize: 100,
    maxSize: 320,
  },
  {
    id: 'client',
    accessorFn: (row) => row.client_id ?? 'Bez klienta',
    header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.client} />,
    meta: { label: 'Klient' },
    cell: ({ row, table }) => {
      const meta = table.options.meta as InvoicesTableMeta | undefined
      const client = row.original.client_id ? meta?.clientsById.get(row.original.client_id) ?? null : null

      return (
        <ClientDisplay
          client={client}
          variant="cell"
          size="md"
        />
      )
    },
    sortingFn: 'alphanumeric',
    size: 240,
    minSize: 160,
    maxSize: 480,
  },
  {
    id: 'invoice_date',
    accessorFn: (row) => new Date(row.invoice_date ?? row.issue_date ?? '1970-01-01').getTime(),
    header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.invoice_date} />,
    meta: { label: 'Data' },
    cell: ({ row }) => formatInvoiceDate(row.original.invoice_date || row.original.issue_date),
    size: 140,
    minSize: 110,
    maxSize: 240,
  },
  {
    id: 'billing_period',
    accessorFn: (row) => row.billing_period ?? '',
    header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.billing_period} />,
    meta: { label: 'Kwartał' },
    cell: ({ row }) => row.original.billing_period || '-',
    size: 120,
    minSize: 90,
    maxSize: 200,
  },
  {
    id: 'payment_status',
    accessorFn: (row) => (row.is_paid ? 'paid' : 'unpaid'),
    header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.payment_status} />,
    meta: { label: 'Status' },
    cell: ({ row }) => (
      <Badge
        variant={row.original.is_paid ? 'secondary' : 'outline'}
        className={
          row.original.is_paid
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-amber-700 dark:text-amber-400'
        }
      >
        {row.original.is_paid ? 'Opłacona' : 'Nieopłacona'}
      </Badge>
    ),
    size: 140,
    minSize: 110,
    maxSize: 200,
  },
  {
    id: 'amount',
    accessorFn: (row) => Number(row.amount ?? 0),
    header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.amount} />,
    meta: { label: 'Kwota' },
    cell: ({ row }) => formatCurrency(row.original.amount, row.original.currency),
    size: 140,
    minSize: 110,
    maxSize: 240,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">{COLUMN_LABELS.actions}</span>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as InvoicesTableMeta | undefined

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Akcje faktury">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => meta?.onEdit(row.original)}>
                <Pencil className="size-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => meta?.onDelete(row.original)}>
                <Trash2 className="size-4" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableResizing: false,
    enableHiding: false,
    enableSorting: false,
    size: 64,
    minSize: 64,
    maxSize: 64,
  },
]
