'use client'

import { Search } from 'lucide-react'
import type { Table } from '@tanstack/react-table'
import type { Invoice } from '@/lib/types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InvoiceStatusFilter } from '../_domain'
import { InvoicesTableViewOptions } from './InvoicesTableViewOptions'

interface InvoicesTableToolbarProps {
  table: Table<Invoice>
  query: string
  status: InvoiceStatusFilter
  onQueryChange: (value: string) => void
  onStatusChange: (value: InvoiceStatusFilter) => void
}

export function InvoicesTableToolbar({
  table,
  query,
  status,
  onQueryChange,
  onStatusChange,
}: InvoicesTableToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Szukaj po ID, nazwie, numerze lub odbiorcy..."
          className="h-9 pl-9"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value: InvoiceStatusFilter) => onStatusChange(value)}
      >
        <SelectTrigger className="h-9 w-full sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie statusy</SelectItem>
          <SelectItem value="paid">Opłacone</SelectItem>
          <SelectItem value="unpaid">Nieopłacone</SelectItem>
        </SelectContent>
      </Select>

      <InvoicesTableViewOptions table={table} />
    </div>
  )
}
