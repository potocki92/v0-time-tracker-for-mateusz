'use client'

import { SlidersHorizontal } from 'lucide-react'
import type { Table } from '@tanstack/react-table'
import type { Invoice } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { COLUMN_LABELS } from './columns'

interface InvoicesTableViewOptionsProps {
  table: Table<Invoice>
}

export function InvoicesTableViewOptions({ table }: InvoicesTableViewOptionsProps) {
  const toggleableColumns = table.getAllColumns().filter((column) => column.getCanHide())

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-9 gap-2">
          <SlidersHorizontal className="size-4" />
          Widok
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Widoczne kolumny</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
            onSelect={(event) => event.preventDefault()}
          >
            {COLUMN_LABELS[column.id] ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
