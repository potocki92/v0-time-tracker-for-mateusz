import type { ColumnDef, RowData } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'

export function createSelectionColumn<TData extends RowData>(): ColumnDef<TData, unknown> {
  return {
    id: 'select',
    enableHiding: false,
    enableSorting: false,
    size: 42,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        aria-label="Select row"
      />
    ),
  }
}
