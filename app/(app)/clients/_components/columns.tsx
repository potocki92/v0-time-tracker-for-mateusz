'use client'

import { History, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientDisplay } from '@/components/common/ClientDisplay'
import { formatCurrency } from '@/lib/helpers'
import type { ClientWithStats } from '../_domain/clients.types'
import { WORK_TYPE_LABELS } from '../_domain/clients.constants'

export type ClientsTableMeta = {
  onEdit: (client: ClientWithStats) => void
  onDelete: (client: ClientWithStats) => void
  onShowHistory: (client: ClientWithStats) => void
}

export const columns: ColumnDef<ClientWithStats>[] = [
  {
    accessorKey: 'name',
    header: 'Klient',
    meta: { label: 'Klient' },
    size: 280,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: row.original.color }} aria-hidden />
        <ClientDisplay client={row.original} variant="row" size="md" />
      </div>
    ),
  },
  {
    id: 'work_type',
    accessorFn: (row) => row.work_type,
    header: 'Typ / Waluta',
    meta: { label: 'Typ / Waluta' },
    size: 170,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-xs">{WORK_TYPE_LABELS[row.original.work_type]}</Badge>
        <Badge variant="outline" className="text-xs">{row.original.currency}</Badge>
      </div>
    ),
  },
  {
    accessorKey: 'currency',
    header: 'Waluta',
    meta: { label: 'Waluta' },
    size: 90,
  },
  {
    id: 'rate',
    accessorFn: (row) => row.rate,
    header: 'Stawka',
    meta: { label: 'Stawka' },
    size: 140,
    cell: ({ row }) => {
      const unit = row.original.work_type === 'hourly' ? 'h' : (row.original.unit ?? 'szt')
      return (
        <div className="font-semibold tabular-nums">
          {formatCurrency(row.original.rate, row.original.currency)}
          <span className="text-xs font-normal text-muted-foreground">/{unit}</span>
        </div>
      )
    },
  },
  {
    id: 'earnings',
    accessorFn: (row) => row.totalEarningsInClientCurrency,
    header: 'Zarobki',
    meta: { label: 'Zarobki' },
    size: 140,
    cell: ({ row }) =>
      row.original.totalEarningsInClientCurrency > 0
        ? formatCurrency(row.original.totalEarningsInClientCurrency, row.original.currency)
        : '—',
  },
  {
    id: 'hours',
    accessorFn: (row) => row.totalHours,
    header: 'Godziny / Dni',
    meta: { label: 'Godziny / Dni' },
    size: 130,
    cell: ({ row }) =>
      row.original.totalHours > 0
        ? `${row.original.totalHours.toFixed(1)}h · ${row.original.totalDays} dni`
        : '—',
  },
  {
    id: 'actions',
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    size: 60,
    cell: ({ row, table }) => {
      const meta = table.options.meta as ClientsTableMeta | undefined

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" aria-label="Akcje klienta">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => meta?.onShowHistory(row.original)}>
              <History className="mr-2 size-4" /> Historia stawek
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onEdit(row.original)}>
              <Pencil className="mr-2 size-4" /> Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onDelete(row.original)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 size-4" /> Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
