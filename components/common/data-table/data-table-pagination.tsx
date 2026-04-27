'use client'

import type { RowData, Table as TanstackTable } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PAGE_SIZE_OPTIONS = [8, 16, 32, 64] as const

export function DataTablePagination<TData extends RowData>({
  table,
}: {
  table: TanstackTable<TData>
}) {
  const { pageIndex, pageSize } = table.getState().pagination
  const total = table.getFilteredRowModel().rows.length
  const totalPages = Math.max(1, table.getPageCount())
  const currentPage = pageIndex + 1
  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <nav
      className="flex flex-col gap-2 px-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginacja tabeli"
    >
      <span aria-live="polite">
        {total === 0
          ? 'Brak wyników'
          : `${start}–${end} z ${total} · strona ${currentPage}/${totalPages}`}
      </span>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5">
          <span className="sr-only">Wyników na stronę</span>
          <select
            value={pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Wyników na stronę"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}/str.
              </option>
            ))}
          </select>
        </label>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="Pierwsza strona"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Następna strona"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.setPageIndex(totalPages - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Ostatnia strona"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
