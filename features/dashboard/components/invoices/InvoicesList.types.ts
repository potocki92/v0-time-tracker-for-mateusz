import type { Currency } from '@/features/dashboard/types/dashboard.types'

// ── Domain types ──────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id:              string
  name:            string
  amount:          number
  currency:        Currency
  billing_period?: string | null
  invoice_date?:   string | null
}

// ── Mutation types ────────────────────────────────────────────────────────────

export interface MarkPaidVariables {
  invoiceId: string
}

export interface MarkPaidContext {
  /** Snapshot przed optimistic update — do rollbacku */
  previousData: import('@/features/dashboard/types/dashboard.types').DashboardData | undefined
}

// ── Component props ───────────────────────────────────────────────────────────

export interface InvoicesListProps {
  invoices: InvoiceItem[]
}

export interface InvoiceRowProps {
  invoice:     InvoiceItem
  isPending:   boolean
  onMarkPaid:  (id: string) => void
}