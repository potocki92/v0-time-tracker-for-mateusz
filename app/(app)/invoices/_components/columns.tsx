'use client'

import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Column, ColumnDef } from '@tanstack/react-table'
import type { Client, Invoice } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials, stringToColor } from '../_domain/utils'

interface CreateColumnsOptions {
  clients: Client[]
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

function getClientName(clients: Client[], clientId: string | null) {
  if (!clientId) return 'Bez klienta'
  return clients.find((client) => client.id === clientId)?.name ?? 'Nieznany klient'
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

export const COLUMN_LABELS: Record<string, string> = {
  invoice_number: 'ID',
  client: 'Klient',
  invoice_date: 'Data',
  billing_period: 'Kwartał',
  status: 'Status',
  amount: 'Kwota',
  actions: 'Akcje',
}

export function createInvoiceColumns({
  clients,
  onEdit,
  onDelete,
}: CreateColumnsOptions): ColumnDef<Invoice>[] {
  return [
    {
      id: 'invoice_number',
      accessorFn: (row) => row.invoice_number ?? row.id.slice(0, 8),
      header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.invoice_number} />,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.invoice_number || row.original.id.slice(0, 8)}
        </span>
      ),
      size: 140,
      minSize: 100,
    },
    {
      id: 'client',
      accessorFn: (row) => getClientName(clients, row.client_id),
      header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.client} />,
      cell: ({ row }) => {
        const name = getClientName(clients, row.original.client_id)
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-6 shrink-0">
              <AvatarFallback
                className="text-[10px] font-bold text-white"
                style={{ background: stringToColor(name) }}
              >
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{name}</span>
          </div>
        )
      },
      sortingFn: 'alphanumeric',
      size: 240,
      minSize: 160,
    },
    {
      id: 'invoice_date',
      accessorFn: (row) => new Date(row.invoice_date ?? row.issue_date ?? '1970-01-01').getTime(),
      header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.invoice_date} />,
      cell: ({ row }) => formatInvoiceDate(row.original.invoice_date || row.original.issue_date),
      size: 140,
      minSize: 110,
    },
    {
      id: 'billing_period',
      accessorFn: (row) => row.billing_period ?? '',
      header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.billing_period} />,
      cell: ({ row }) => row.original.billing_period || '-',
      size: 120,
      minSize: 90,
    },
    {
      id: 'status',
      accessorFn: (row) => (row.is_paid ? 1 : 0),
      header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.status} />,
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
    },
    {
      id: 'amount',
      accessorFn: (row) => Number(row.amount ?? 0),
      header: ({ column }) => <SortableHeader column={column} label={COLUMN_LABELS.amount} />,
      cell: ({ row }) => formatCurrency(row.original.amount, row.original.currency),
      size: 140,
      minSize: 110,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{COLUMN_LABELS.actions}</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Akcje faktury">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="size-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                <Trash2 className="size-4" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableResizing: false,
      enableHiding: false,
      enableSorting: false,
      size: 64,
      minSize: 64,
      maxSize: 64,
    },
  ]
}
