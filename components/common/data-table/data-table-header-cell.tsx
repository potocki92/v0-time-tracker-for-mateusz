'use client'

import { CSS } from '@dnd-kit/utilities'
import { flexRender, type Header, type RowData } from '@tanstack/react-table'
import { useSortable } from '@dnd-kit/sortable'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type DataTableHeaderCellProps<TData extends RowData> = {
  header: Header<TData, unknown>
  enableColumnDnd?: boolean
}

export function DataTableHeaderCell<TData extends RowData>({
  header,
  enableColumnDnd = true,
}: DataTableHeaderCellProps<TData>) {
  const canDrag = enableColumnDnd && !header.isPlaceholder
  const sortable = useSortable({
    id: header.column.id,
    disabled: !canDrag,
  })

  const style = {
    width: header.getSize(),
    minWidth: header.getSize(),
    maxWidth: header.getSize(),
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.8 : 1,
    zIndex: sortable.isDragging ? 20 : undefined,
  }

  return (
    <TableHead
      ref={canDrag ? sortable.setNodeRef : undefined}
      style={style}
      className={cn('group/th relative h-10 px-2', canDrag && 'cursor-grab active:cursor-grabbing')}
      aria-label={canDrag ? `Column ${header.column.id}. Drag to reorder` : undefined}
      {...(canDrag ? sortable.attributes : {})}
      {...(canDrag ? sortable.listeners : {})}
    >
      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
      {header.column.getCanResize() && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${header.column.id} column`}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onDoubleClick={() => header.column.resetSize()}
          className={cn(
            'absolute right-0 top-0 z-30 flex h-full w-2 cursor-col-resize touch-none items-center justify-center',
            'opacity-0 transition-opacity group-hover/th:opacity-100',
            header.column.getIsResizing() && 'opacity-100',
          )}
        >
          <span
            className={cn(
              'h-5 w-px rounded-full bg-zinc-300 transition-colors dark:bg-zinc-700',
              header.column.getIsResizing() && 'h-6 w-0.5 bg-primary',
            )}
          />
        </div>
      )}
    </TableHead>
  )
}
