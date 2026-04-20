'use client'

import { useMemo } from 'react'
import { flexRender, type RowData, type Table as TanstackTable } from '@tanstack/react-table'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'

export function DataTableBody<TData extends RowData>({ table, emptyLabel }: { table: TanstackTable<TData>; emptyLabel: string }) {
  const rows = table.getRowModel().rows
  const visibleColumnCount = table.getVisibleLeafColumns().length

  const renderedRows = useMemo(() => rows, [rows])

  if (renderedRows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={visibleColumnCount} className="h-24 px-3 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody>
      {renderedRows.map((row) => (
        <TableRow
          key={row.id}
          className="border-zinc-200/70 transition-colors hover:bg-zinc-50/70 dark:border-zinc-800/70 dark:hover:bg-zinc-900/40"
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell
              key={cell.id}
              style={{ width: cell.column.getSize(), minWidth: cell.column.getSize(), maxWidth: cell.column.getSize() }}
              className="px-2 py-2"
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
