'use client'

import { useMemo, useState } from 'react'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { Table, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableBody } from './data-table-body'
import { DataTableHeaderCell } from './data-table-header-cell'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import type { DataTableProps } from './types'

export function DataTable<TData extends RowData>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  emptyLabel = 'No records found.',
  filters = [],
  initialVisibility,
  onAddRow,
  onDeleteRows,
  pageSize = 8,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialVisibility ?? {})
  const [columnSizing, setColumnSizing] = useState({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility, columnSizing, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    enableRowSelection: Boolean(onDeleteRows),
    initialState: { pagination: { pageSize } },
  })

  const selectedRows = useMemo(() => table.getFilteredSelectedRowModel().rows.map((row) => row.original), [table, rowSelection])

  return (
    <div className="space-y-3">
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        filters={filters}
        searchPlaceholder={searchPlaceholder}
        selectedCount={selectedRows.length}
        onAddRow={onAddRow}
        onDeleteSelected={() => onDeleteRows?.(selectedRows)}
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200/70 bg-card dark:border-zinc-800/70">
        <div className="w-full overflow-x-auto">
          <Table style={{ width: table.getTotalSize() }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-zinc-200/70 dark:border-zinc-800/70">
                  {headerGroup.headers.map((header) => (
                    <DataTableHeaderCell key={header.id} header={header} />
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <DataTableBody table={table} emptyLabel={emptyLabel} />
          </Table>
        </div>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
