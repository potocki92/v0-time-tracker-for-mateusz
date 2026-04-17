import type { InvoicesData } from '../_domain'
import { fetchInvoicesAndClients } from './invoices.fetchers'

export async function getInvoicesData(): Promise<InvoicesData> {
  return fetchInvoicesAndClients()
}
