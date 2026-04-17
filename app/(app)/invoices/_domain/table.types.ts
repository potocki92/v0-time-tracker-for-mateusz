import type {
  ColumnOrderState,
  ColumnSizingState,
  VisibilityState,
} from '@tanstack/react-table'

export interface InvoicesTableSettings {
  columnVisibility: VisibilityState
  columnSizing: ColumnSizingState
  columnOrder: ColumnOrderState
}

export const INVOICES_TABLE_STORAGE_KEY = 'app-prefs:invoices-table'

export const INVOICES_TABLE_COLUMN_IDS = [
  'invoice_number',
  'client',
  'invoice_date',
  'billing_period',
  'status',
  'amount',
  'actions',
] as const

export type InvoicesTableColumnId = (typeof INVOICES_TABLE_COLUMN_IDS)[number]

export const DEFAULT_INVOICES_TABLE_SETTINGS: InvoicesTableSettings = {
  columnVisibility: {},
  columnSizing: {},
  columnOrder: [...INVOICES_TABLE_COLUMN_IDS],
}
