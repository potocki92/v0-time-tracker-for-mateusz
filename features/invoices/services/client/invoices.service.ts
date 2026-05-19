import type { InvoicesData } from '../../domain'
import { fetchInvoicesAndClients } from './invoices.fetchers'

export async function getInvoicesData(): Promise<InvoicesData> {
  return fetchInvoicesAndClients()
}
