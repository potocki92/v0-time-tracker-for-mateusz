import type {
  ColumnDef,
  RowData,
  TableMeta,
  Table as TanstackTable,
  VisibilityState,
} from '@tanstack/react-table'

export type DataTableFilterOption = {
  label: string
  value: string
}

export type DataTableFilter = {
  columnId: string
  label: string
  type?: 'chips' | 'select'
  options: DataTableFilterOption[]
  allLabel?: string
}

export type DataTableStorageKey = string | {
  filters: string
  layout?: string
}

export type DataTableProps<TData extends RowData> = {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  searchPlaceholder?: string
  emptyLabel?: string
  filters?: DataTableFilter[]
  storageKey?: DataTableStorageKey
  initialVisibility?: VisibilityState
  pageSize?: number
  onAddRow?: () => void
  onDeleteRows?: (rows: TData[]) => void
  enableColumnDnd?: boolean
  meta?: TableMeta<TData>
}

export type DataTableToolbarProps<TData extends RowData> = {
  table: TanstackTable<TData>
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  filters: DataTableFilter[]
  searchPlaceholder: string
  selectedCount: number
  onAddRow?: () => void
  onDeleteSelected?: () => void
}
