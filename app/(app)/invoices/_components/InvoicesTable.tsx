'use client'

import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnSizingState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import type { Client, Invoice } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createInvoiceColumns } from './columns'
import { InvoicesTableToolbar } from './InvoicesTableToolbar'
import type { InvoiceStatusFilter } from '../_domain'

interface InvoicesTableProps {
  invoices: Invoice[]
  clients: Client[]
  query: string
  status: InvoiceStatusFilter
  onQueryChange: (value: string) => void
  onStatusChange: (value: InvoiceStatusFilter) => void
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

export function InvoicesTable({
  invoices,
  clients,
  query,
  status,
  onQueryChange,
  onStatusChange,
  onEdit,
  onDelete,
}: InvoicesTableProps) {
  const columns = useMemo(
    () => createInvoiceColumns({ clients, onEdit, onDelete }),
    [clients, onEdit, onDelete],
  )

  const [sorting, setSorting] = useState<SortingState>([{ id: 'invoice_date', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting, columnVisibility, columnSizing },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  })

  return (
    <div className="space-y-3">
      <InvoicesTableToolbar
        table={table}
        query={query}
        status={status}
        onQueryChange={onQueryChange}
        onStatusChange={onStatusChange}
      />

      <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table style={{ width: table.getCenterTotalSize() }}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="group/th relative select-none"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanResize() && (
                          <div
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Zmień szerokość kolumny"
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onDoubleClick={() => header.column.resetSize()}
                            className={[
                              'absolute right-0 top-0 z-10 flex h-full w-2 cursor-col-resize touch-none items-center justify-center',
                              'opacity-0 transition-opacity group-hover/th:opacity-100',
                              header.column.getIsResizing() ? 'opacity-100' : '',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'h-4 w-px rounded-full bg-border transition-colors',
                                header.column.getIsResizing() ? 'bg-primary w-0.5 h-5' : '',
                              ].join(' ')}
                            />
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={table.getVisibleLeafColumns().length}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      Brak wyników wyszukiwania. Zmień frazę lub filtr statusu.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className="overflow-hidden"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
