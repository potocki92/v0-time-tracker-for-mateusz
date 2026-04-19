'use client'

import type { RowData, Table as TanstackTable } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'

export function DataTablePagination<TData extends RowData>({ table }: { table: TanstackTable<TData> }) {
  return (
    <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
      <span>
        {table.getFilteredRowModel().rows.length} rezultatów · {table.getState().pagination.pageIndex + 1}/{Math.max(1, table.getPageCount())}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Wstecz
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Dalej
        </Button>
      </div>
    </div>
  )
}
