import type { Client, CURRENCY, Invoice } from '@/lib/types'

export interface InvoicesData {
  invoices: Invoice[]
  clients: Client[]
}

export type InvoiceStatusFilter = 'all' | 'paid' | 'unpaid'

export interface InvoiceFormValues {
  name: string
  invoice_number: string
  recipient: string
  billing_period: string
  invoice_date: string
  amount: number
  currency: CURRENCY
  is_paid: boolean
  notes: string
  file: File | null
  client_id: string | null
  new_client_name: string
}

export const INVOICES_MANAGER_QUERY_KEY = ['dashboard-module', 'invoices', 'manager'] as const

export interface SaveInvoiceInput {
  invoiceId?: string
  values: InvoiceFormValues
}
