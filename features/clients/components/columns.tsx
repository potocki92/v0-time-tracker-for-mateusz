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
import { cn } from '@/lib/utils'
import type { ClientWithStats } from '../domain/clients.types'
import {
  ACTIVITY_DOT,
  ACTIVITY_LABELS,
  WORK_TYPE_LABELS,
} from '../domain/clients.constants'
import { deriveActivity, formatRelativeDate } from '../domain/clients.selectors'

export type ClientsTableMeta = {
  onEdit: (client: ClientWithStats) => void
  onDelete: (client: ClientWithStats) => void
  onShowHistory: (client: ClientWithStats) => void
}

/** 7.5 → „7,5", 816 → „816" — bez zbędnego „,00" przy pełnych godzinach. */
function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace('.', ',')
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
    size: 150,
    // `816.0h` — końcówka `.0` przy pełnych godzinach rozpychała kolumnę
    // na tyle, że treść wchodziła w sąsiednią.
    cell: ({ row }) =>
      row.original.totalHours > 0
        ? `${formatHours(row.original.totalHours)} h · ${row.original.totalDays} dni`
        : '—',
  },
  {
    id: 'lastEntry',
    // Sortujemy po surowej dacie, a nie po „5 mies. temu" — tekst układałby się
    // alfabetycznie. Klienci bez wpisów lądują na końcu.
    accessorFn: (row) => row.lastEntryDate ?? '',
    header: 'Ostatni wpis',
    meta: { label: 'Ostatni wpis' },
    size: 150,
    cell: ({ row }) => {
      const activity = deriveActivity(row.original)
      const relative = formatRelativeDate(row.original.lastEntryDate)
      return (
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn('size-1.5 shrink-0 rounded-full', ACTIVITY_DOT[activity])}
          />
          <span className="truncate tabular-nums">{relative ?? '—'}</span>
          <span className="sr-only">{ACTIVITY_LABELS[activity]}</span>
        </div>
      )
    },
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
