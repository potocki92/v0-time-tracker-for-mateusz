'use client'

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { History, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, type DataTableFilter } from '@/components/common/data-table'
import { ClientDisplay } from '@/components/common/ClientDisplay'
import { formatCurrency } from '@/lib/helpers'
import type { ClientWithStats } from '../_domain/clients.types'
import { WORK_TYPE_LABELS } from '../_domain/clients.constants'

type Props = {
  clients: ClientWithStats[]
  onEdit: (client: ClientWithStats) => void
  onDelete: (client: ClientWithStats) => void
  onShowHistory: (client: ClientWithStats) => void
}

export function ClientsTable({ clients, onEdit, onDelete, onShowHistory }: Props) {
  const columns = useMemo<ColumnDef<ClientWithStats, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Client',
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
        header: 'Type / Currency',
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
        header: 'Currency',
        size: 90,
      },
      {
        id: 'rate',
        accessorFn: (row) => row.rate,
        header: 'Rate',
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
        header: 'Earnings',
        size: 140,
        cell: ({ row }) =>
          row.original.totalEarningsInClientCurrency > 0
            ? formatCurrency(row.original.totalEarningsInClientCurrency, row.original.currency)
            : '—',
      },
      {
        id: 'hours',
        accessorFn: (row) => row.totalHours,
        header: 'Hours / Days',
        size: 130,
        cell: ({ row }) =>
          row.original.totalHours > 0
            ? `${row.original.totalHours.toFixed(1)}h · ${row.original.totalDays} days`
            : '—',
      },
      {
        id: 'actions',
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
        size: 60,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onShowHistory(row.original)}>
                <History className="mr-2 size-4" /> History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onDelete, onEdit, onShowHistory],
  )

  const filters = useMemo<DataTableFilter[]>(() => [
    {
      columnId: 'work_type',
      label: 'Work type',
      type: 'chips',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Hourly', value: 'hourly' },
        { label: 'Piecework', value: 'piecework' },
      ],
    },
    {
      columnId: 'currency',
      label: 'Currency',
      type: 'select',
      options: [
        { label: 'PLN', value: 'PLN' },
        { label: 'EUR', value: 'EUR' },
      ],
    },
  ], [])

  return (
    <DataTable
      data={clients}
      columns={columns}
      filters={filters}
      searchPlaceholder="Search clients, city, email..."
      emptyLabel="No clients found."
      initialVisibility={{ hours: false, currency: false }}
    />
  )
}
