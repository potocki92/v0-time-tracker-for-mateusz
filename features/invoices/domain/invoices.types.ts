import type { Client, CURRENCY, Invoice, InvoiceLifecycleStatus } from '@/lib/types'

export type BillingQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export const BILLING_QUARTERS: readonly BillingQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'] as const

/** Map a 1-based month into its calendar quarter. */
export function quarterFromMonthNumber(month: number): BillingQuarter {
  if (month <= 3) return 'Q1'
  if (month <= 6) return 'Q2'
  if (month <= 9) return 'Q3'
  return 'Q4'
}

/** Inclusive ISO date range covering an entire calendar quarter. */
export function quarterDateRange(year: number, quarter: BillingQuarter): { start: string; end: string } {
  const startMonth = (Number(quarter[1]) - 1) * 3
  const start = new Date(Date.UTC(year, startMonth, 1))
  const end = new Date(Date.UTC(year, startMonth + 3, 0))
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    start: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`,
    end: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
  }
}

export interface InvoiceBuyerDetails {
  name: string
  tax_id: string
  country_code: string
  address: string
  city: string
  postal_code: string
  email: string
}

export interface InvoiceLineItemPayload {
  description: string
  unit: string
  quantity: number
  unit_price_net: number
  vat_rate: number
}

export interface InvoicesData {
  invoices: Invoice[]
  clients: Client[]
  settings: InvoiceSettings
}

export type InvoiceTemplateKey = 'classic' | 'modern' | 'minimal'

export interface InvoiceSettings {
  userPrefix: string
  numberingPattern: string
  series: string
  branch: string
  resetSequence: 'yearly' | 'monthly'
  defaultTemplate: InvoiceTemplateKey
  templateAccentColor: string
  templateFooter: string
  autoIssueEnabled: boolean
  dueDays: number
}

export interface InvoiceFormValues {
  name: string
  invoice_number: string
  recipient: string
  billing_period: string
  billing_quarter: BillingQuarter
  billing_year: number
  invoice_date: string
  amount: number
  currency: CURRENCY
  is_paid: boolean
  /**
   * Lifecycle status. When omitted on create, the server defaults to `SENT`
   * (manual issuance is always treated as "issued"). On edit, omitting it
   * preserves the existing status so the user doesn't accidentally regress
   * a SENT invoice back to DRAFT just by saving form changes.
   */
  status?: InvoiceLifecycleStatus
  notes: string
  template_key: InvoiceTemplateKey
  file: File | null
  client_id: string | null
  new_client_name: string
  /**
   * Buyer block from the rich invoice builder. When present and
   * `client_id` resolves to an existing client, the matching columns on
   * `clients` are upserted so the data round-trips into the address book.
   */
  buyer?: InvoiceBuyerDetails
  /** Optional structured line items persisted via `invoice_line_items`. */
  line_items?: InvoiceLineItemPayload[]
}

export const INVOICES_MANAGER_QUERY_KEY = ['dashboard-module', 'invoices', 'manager'] as const

export interface SaveInvoiceInput {
  invoiceId?: string
  values: InvoiceFormValues
}

export interface AutoIssueResult {
  created: number
  skipped: number
  periodStart: string
  periodEnd: string
}

export interface ImportInvoiceCsvRow {
  name: string
  invoice_number: string
  recipient: string
  client_name: string
  billing_period: string
  invoice_date: string
  amount: number
  currency: CURRENCY
  is_paid: boolean
  notes: string
}
