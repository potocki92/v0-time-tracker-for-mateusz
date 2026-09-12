import { quarterOfMonth } from './range'
import type { StatementCurrencyTotal, StatementQuarterTotal, StatementRow } from './types'

/**
 * Sumy wykazu.
 *
 * Waluty NIE sa sprowadzane do jednej kursem — faktura w EUR i faktura w PLN
 * sumuja sie osobno, bo kwota po przeliczeniu nie istnieje w zadnej ksiedze.
 * Ta sama zasada rzadzi `lib/finance/invoice-currency-totals`.
 */

type Bucket = {
  invoiceCount: number
  netMinor: number
  vatMinor: number
  grossMinor: number
}

const emptyBucket = (): Bucket => ({ invoiceCount: 0, netMinor: 0, vatMinor: 0, grossMinor: 0 })

function accumulate(bucket: Bucket, row: StatementRow): void {
  bucket.invoiceCount += 1
  bucket.netMinor += row.netMinor
  bucket.vatMinor += row.vatMinor
  bucket.grossMinor += row.grossMinor
}

/**
 * Suma per waluta, z rozbiciem na zaplacone i niezaplacone.
 *
 * Rozbicie ma znaczenie przy metodzie kasowej: urzad pyta o to, co wplynelo,
 * a nie o to, co wystawiono. Faktury ANULOWANE licza sie do kwot zerowych
 * tylko wtedy, gdy takie sa w bazie — modul niczego nie zeruje za uzytkownika.
 */
export function buildCurrencyTotals(rows: readonly StatementRow[]): StatementCurrencyTotal[] {
  const buckets = new Map<string, StatementCurrencyTotal>()

  for (const row of rows) {
    const existing = buckets.get(row.currency) ?? {
      currency: row.currency,
      invoiceCount: 0,
      netMinor: 0,
      vatMinor: 0,
      grossMinor: 0,
      paidGrossMinor: 0,
      unpaidGrossMinor: 0,
    }

    accumulate(existing, row)
    if (row.status === 'PAID') existing.paidGrossMinor += row.grossMinor
    else if (row.status !== 'CANCELLED') existing.unpaidGrossMinor += row.grossMinor

    buckets.set(row.currency, existing)
  }

  return [...buckets.values()].sort((a, b) => a.currency.localeCompare(b.currency))
}

/**
 * Suma per kwartal i waluta — po DACIE WYSTAWIENIA, bo to ona wyznacza okres
 * rozliczeniowy zaliczki.
 */
export function buildQuarterTotals(rows: readonly StatementRow[]): StatementQuarterTotal[] {
  const buckets = new Map<string, StatementQuarterTotal>()

  for (const row of rows) {
    const [year, month] = row.issueDate.split('-').map(Number)
    const quarter = quarterOfMonth(month)
    const key = `${year}-Q${quarter}:${row.currency}`

    const existing =
      buckets.get(key) ??
      ({
        key: `${year}-Q${quarter}`,
        year,
        quarter,
        currency: row.currency,
        ...emptyBucket(),
      } satisfies StatementQuarterTotal)

    accumulate(existing, row)
    buckets.set(key, existing)
  }

  return [...buckets.values()].sort(
    (a, b) => a.year - b.year || a.quarter - b.quarter || a.currency.localeCompare(b.currency),
  )
}
