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

export type DataTableSelectFilter = {
  columnId: string
  label: string
  type?: 'chips' | 'select'
  options: DataTableFilterOption[]
  allLabel?: string
}

export type DataTableDateRangeFilter = {
  columnId: string
  label: string
  type: 'dateRange'
}

export type DataTableFilter = DataTableSelectFilter | DataTableDateRangeFilter

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
  /**
   * URL search-param namespace for filter/pagination state. When set, the
   * table syncs `globalFilter`, `columnFilters`, and `pageIndex` with
   * `?{key}_q`, `?{key}_f`, `?{key}_p` so the view is bookmarkable.
   */
  urlStateKey?: string
  initialVisibility?: VisibilityState
  pageSize?: number
  /** Debounce (ms) applied to the global search input. Defaults to 300ms. */
  searchDebounceMs?: number
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
