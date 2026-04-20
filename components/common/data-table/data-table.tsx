'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnSizingState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { Table, TableHeader, TableRow } from '@/components/ui/table'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { DataTableBody } from './data-table-body'
import { DataTableHeaderCell } from './data-table-header-cell'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import type { DataTableProps } from './types'
import { useDataTableLayoutStorage } from './use-data-table-layout-storage'

const DISABLED_FILTERS_KEY = '__data-table-filters_disabled'

function resolveStorageKey(storageKey: DataTableProps<RowData>['storageKey']) {
  if (!storageKey) {
    return {
      filtersKey: DISABLED_FILTERS_KEY,
      layoutKey: undefined,
    }
  }

  if (typeof storageKey === 'string') {
    return {
      filtersKey: storageKey,
      layoutKey: storageKey,
    }
  }

  return {
    filtersKey: storageKey.filters,
    layoutKey: storageKey.layout,
  }
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  emptyLabel = 'No records found.',
  filters = [],
  storageKey,
  initialVisibility,
  onAddRow,
  onDeleteRows,
  pageSize = 8,
  enableColumnDnd = true,
  meta,
}: DataTableProps<TData>) {
  const { filtersKey, layoutKey } = resolveStorageKey(storageKey)
  const [sorting, setSorting] = useState<SortingState>([])
  const [persistedFilters, setPersistedFilters] = useLocalStorage<{
    globalFilter: string
    columnFilters: ColumnFiltersState
  }>(
    filtersKey,
    { globalFilter: '', columnFilters: [] },
  )
  const [globalFilter, setGlobalFilterState] = useState(filtersKey !== DISABLED_FILTERS_KEY ? persistedFilters.globalFilter : '')
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>(
    filtersKey !== DISABLED_FILTERS_KEY ? persistedFilters.columnFilters : [],
  )
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialVisibility ?? {})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { layoutState, persistLayout } = useDataTableLayoutStorage(layoutKey)

  const [columnSizing, setColumnSizingState] = useState<ColumnSizingState>(layoutState.columnSizing)
  const [columnOrder, setColumnOrderState] = useState<ColumnOrderState>(layoutState.columnOrder)

  useEffect(() => {
    setColumnSizingState(layoutState.columnSizing)
    setColumnOrderState(layoutState.columnOrder)
  }, [layoutState.columnOrder, layoutState.columnSizing])

  const setGlobalFilter = useCallback((value: string) => {
    setGlobalFilterState(value)
    if (filtersKey !== DISABLED_FILTERS_KEY) {
      setPersistedFilters((prev) => ({ ...prev, globalFilter: value }))
    }
  }, [filtersKey, setPersistedFilters])

  const setColumnFilters = useCallback((value: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
    setColumnFiltersState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      if (filtersKey !== DISABLED_FILTERS_KEY) {
        setPersistedFilters((persisted) => ({ ...persisted, columnFilters: next }))
      }
      return next
    })
  }, [filtersKey, setPersistedFilters])

  const setColumnSizing = useCallback((value: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)) => {
    setColumnSizingState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      persistLayout?.((current) => ({ ...current, columnSizing: next }))
      return next
    })
  }, [persistLayout])

  const setColumnOrder = useCallback((value: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => {
    setColumnOrderState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      persistLayout?.((current) => ({ ...current, columnOrder: next }))
      return next
    })
  }, [persistLayout])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility, columnSizing, rowSelection, columnOrder },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
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
    meta,
  })

  const selectedRows = useMemo(() => table.getFilteredSelectedRowModel().rows.map((row) => row.original), [table, rowSelection])
  const headerGroups = table.getHeaderGroups()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columnIds = useMemo(
    () => table.getVisibleLeafColumns().map((column) => column.id),
    [table, columnOrder, columnVisibility],
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setColumnOrder((current) => {
      const baseOrder = current.length ? current : table.getAllLeafColumns().map((column) => column.id)
      const oldIndex = baseOrder.indexOf(String(active.id))
      const newIndex = baseOrder.indexOf(String(over.id))

      if (oldIndex < 0 || newIndex < 0) return baseOrder
      return arrayMove(baseOrder, oldIndex, newIndex)
    })
  }, [setColumnOrder, table])

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table className="table-fixed" style={{ width: table.getTotalSize(), minWidth: table.getTotalSize() }}>
              <TableHeader>
                {headerGroups.map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-zinc-200/70 dark:border-zinc-800/70">
                    <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                      {headerGroup.headers.map((header) => (
                        <DataTableHeaderCell
                          key={header.id}
                          header={header}
                          enableColumnDnd={enableColumnDnd}
                        />
                      ))}
                    </SortableContext>
                  </TableRow>
                ))}
              </TableHeader>
              <DataTableBody table={table} emptyLabel={emptyLabel} />
            </Table>
          </DndContext>
        </div>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
