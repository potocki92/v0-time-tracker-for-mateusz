'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnOrderState,
  type Header,
  type SortingState,
} from '@tanstack/react-table'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
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
import {
  DEFAULT_INVOICES_TABLE_SETTINGS,
  INVOICES_TABLE_STORAGE_KEY,
  type InvoiceStatusFilter,
} from '../_domain'
import { useTableSettings } from '../_hooks'

const NON_DRAGGABLE_COLUMN_IDS = new Set(['actions'])

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

  const {
    columnVisibility,
    columnSizing,
    columnOrder,
    setColumnVisibility,
    setColumnSizing,
    setColumnOrder,
  } = useTableSettings({
    storageKey: INVOICES_TABLE_STORAGE_KEY,
    defaults: DEFAULT_INVOICES_TABLE_SETTINGS,
  })

  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting, columnVisibility, columnSizing, columnOrder },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sortableColumnIds = useMemo(
    () =>
      table
        .getVisibleLeafColumns()
        .filter((column) => !NON_DRAGGABLE_COLUMN_IDS.has(column.id))
        .map((column) => column.id),
    // Recompute when order or visibility changes; table instance is stable enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnOrder, columnVisibility, columns],
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setColumnOrder((prev) => {
      const current =
        prev.length > 0 ? prev : table.getAllLeafColumns().map((column) => column.id)
      const oldIndex = current.indexOf(String(active.id))
      const newIndex = current.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) return current
      return arrayMove(current, oldIndex, newIndex)
    })
  }

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToHorizontalAxis]}
              onDragEnd={handleDragEnd}
            >
              <Table style={{ width: table.getCenterTotalSize() }}>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      <SortableContext
                        items={sortableColumnIds}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header) => (
                          <DraggableTableHead
                            key={header.id}
                            header={header}
                            isDraggable={!NON_DRAGGABLE_COLUMN_IDS.has(header.column.id)}
                          />
                        ))}
                      </SortableContext>
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
            </DndContext>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface DraggableTableHeadProps {
  header: Header<Invoice, unknown>
  isDraggable: boolean
}

function DraggableTableHead({ header, isDraggable }: DraggableTableHeadProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,
    disabled: !isDraggable,
  })

  const style: CSSProperties = {
    width: header.getSize(),
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: 'relative',
  }

  return (
    <TableHead ref={setNodeRef} style={style} className="group/th select-none">
      <div className="flex items-center gap-1">
        {isDraggable && (
          <button
            type="button"
            aria-label="Przeciągnij kolumnę"
            className="flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:text-foreground group-hover/th:opacity-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-3.5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </div>
      </div>

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
  )
}
