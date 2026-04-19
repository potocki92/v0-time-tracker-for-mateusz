'use client'

import { flexRender, type Header, type RowData } from '@tanstack/react-table'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function DataTableHeaderCell<TData extends RowData>({ header }: { header: Header<TData, unknown> }) {
  return (
    <TableHead style={{ width: header.getSize() }} className="group/th relative h-10 px-2">
      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
      {header.column.getCanResize() && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onDoubleClick={() => header.column.resetSize()}
          className={cn(
            'absolute right-0 top-0 z-10 flex h-full w-2 cursor-col-resize touch-none items-center justify-center',
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
