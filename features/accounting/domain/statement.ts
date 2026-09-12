import {
  amountsOf,
  isRegisteredInvoice,
  issueDateOf,
  partyOf,
  servicePeriodOf,
  statusOf,
  type RegisteredInvoice,
} from './dataset'
import { buildCurrencyTotals, buildQuarterTotals } from './totals'
import {
  buildWorksitesForInvoice,
  indexEntriesByClient,
  summarizeWorkedPeriod,
} from './worksites'
import type {
  AccountingDataset,
  DateKey,
  StatementClientRef,
  StatementInvoiceRow,
  StatementModel,
  StatementProjectRef,
  StatementRow,
} from './types'

/**
 * Jedyny orkiestrator modulu: dataset → gotowy model wykazu.
 *
 * Czysta funkcja — zero Reacta, zero Supabase, zero formatowania. Komponenty
 * i szablony PDF dostaja liczby, nie surowe wiersze.
 *
 * `today` wchodzi argumentem, bo status faktury zalezy od „dzis"
 * (SENT po terminie platnosci staje sie OVERDUE). Bez wstrzykniecia ten sam
 * dataset dawalby inny wynik na serwerze i w przegladarce.
 */

/** Godziny sumuja sie na floatach — dokument nie moze pokazac „119.99999999". */
const roundHours = (hours: number): number => Math.round(hours * 100) / 100

const byId = <T extends { id: string }>(items: readonly T[]): Map<string, T> =>
  new Map(items.map((item) => [item.id, item]))

/** Faktura, ktora przeszla zawezenie zakresu — data wystawienia jest juz pewna. */
type DatedInvoice = { invoice: StatementInvoiceRow; issueDate: DateKey }

export function buildStatementModel(
  dataset: AccountingDataset,
  today: DateKey,
): StatementModel {
  const now = new Date(`${today}T00:00:00.000Z`)
  const clients: Map<string, StatementClientRef> = byId(dataset.clients)
  const projects: Map<string, StatementProjectRef> = byId(dataset.projects)
  const entriesByClient = indexEntriesByClient(dataset.entries)

  // Zapytanie SQL zaweza po OBU kolumnach daty (`invoice_date` i legacy
  // `issue_date`), wiec moze przepuscic fakture, ktorej data EFEKTYWNA lezy
  // poza zakresem. Zrodlem prawdy dla granic wykazu jest domena.
  const inRange: DatedInvoice[] = []

  for (const invoice of dataset.invoices) {
    const issueDate = issueDateOf(invoice)
    if (issueDate === null || issueDate < dataset.range.start || issueDate > dataset.range.end) {
      continue
    }
    inRange.push({ invoice, issueDate })
  }

  const registered = inRange.filter(
    (item): item is { invoice: RegisteredInvoice; issueDate: DateKey } =>
      isRegisteredInvoice(item.invoice, now),
  )

  const rows: StatementRow[] = registered.map(({ invoice, issueDate }) => {
    const period = servicePeriodOf(invoice)
    const worked = summarizeWorkedPeriod(entriesByClient, invoice.client_id, period)

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      issueDate,
      dueDate: invoice.due_date,
      paidDate: invoice.paid_date ?? null,
      status: statusOf(invoice, now),
      period,
      party: partyOf(invoice, invoice.client_id ? clients.get(invoice.client_id) : undefined),
      description: invoice.description,
      ...amountsOf(invoice),
      worksites: buildWorksitesForInvoice(entriesByClient, projects, invoice.client_id, period),
      workedDays: worked.workedDays,
      hours: roundHours(worked.hours),
    }
  })

  // Kolejnosc dokumentu: chronologicznie po dacie wystawienia, a przy tej
  // samej dacie po numerze — tak czyta sie rejestr sprzedazy.
  rows.sort(
    (a, b) =>
      a.issueDate.localeCompare(b.issueDate) || a.invoiceNumber.localeCompare(b.invoiceNumber),
  )

  return {
    range: dataset.range,
    rows,
    totals: buildCurrencyTotals(rows),
    quarters: buildQuarterTotals(rows),
    missingPeriodCount: rows.filter((row) => row.period === null).length,
    missingLocationCount: rows.filter((row) => row.worksites.length === 0).length,
    draftCount: inRange.length - registered.length,
    datasetIsEmpty: inRange.length === 0,
  }
}
