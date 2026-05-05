import type { Client, CURRENCY, Invoice } from '@/lib/types'

export type BillingQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

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
