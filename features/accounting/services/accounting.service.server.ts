import 'server-only'
import { servicePeriodOf } from '../domain/dataset'
import { workWindowOf } from '../domain/range'
import { ALL, type AccountingDataset } from '../domain/types'
import type { AccountingQueryParams } from './accounting.query'
import {
  fetchStatementClientsServer,
  fetchStatementEntriesServer,
  fetchStatementInvoicesServer,
  fetchStatementProjectsServer,
} from './accounting.fetchers.server'

const asFilter = (value: string): string | null => (value && value !== ALL ? value : null)

/**
 * Dataset wykazu dla zadanego zakresu i klienta.
 *
 * Odczyt jest DWUETAPOWY i to celowo: okno wpisow pracy zalezy od okresow
 * uslug na fakturach, ktore dopiero co przyszly. Pobranie wpisow „na zapas"
 * za caly rok plus margines sciagaloby dane, ktorych wykaz nigdy nie pokaze,
 * a zawezenie do samego zakresu gubiloby adresy faktur przechodzacych przez
 * granice roku.
 */
export async function getAccountingDatasetServer(
  params: AccountingQueryParams,
): Promise<AccountingDataset> {
  const clientId = asFilter(params.clientId)
  const invoices = await fetchStatementInvoicesServer(params.range, clientId)
  const workWindow = workWindowOf(params.range, invoices.map(servicePeriodOf))

  const [entries, clients, projects] = await Promise.all([
    fetchStatementEntriesServer(workWindow, clientId),
    fetchStatementClientsServer(),
    fetchStatementProjectsServer(),
  ])

  return { range: params.range, workWindow, invoices, entries, clients, projects }
}
