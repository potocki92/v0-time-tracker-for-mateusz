import type { InvoiceQueryFilters, InvoicesData } from '../_domain'
import { fetchInvoicesAndClients } from './invoices.fetchers'

export async function getInvoicesData(filters?: InvoiceQueryFilters): Promise<InvoicesData> {
  return fetchInvoicesAndClients(filters)
}
