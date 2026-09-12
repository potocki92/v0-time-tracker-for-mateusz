import { deriveInvoiceStatus, type InvoiceStatus } from '@/lib/finance/invoice-status'
import { fromDb, subtract, type Money } from '@/lib/finance/money'
import { isRealEntry } from '@/lib/finance/realization'
import type { CURRENCY } from '@/lib/types'
import type {
  DateKey,
  StatementClientRef,
  StatementEntryRow,
  StatementInvoiceRow,
  StatementParty,
  StatementRange,
} from './types'

/**
 * Normalizacja wierszy z Supabase do jezyka wykazu: pieniadze policzone RAZ,
 * okres uslugi rozwiazany RAZ, nabywca zlozony RAZ.
 *
 * Ten plik nie sumuje i nie grupuje — od tego sa `worksites.ts` i `totals.ts`.
 */

/** Status wpisu, ktory liczy sie jako wykonana praca. Nieobecnosci nie maja miejsca pracy. */
export const PERFORMED_WORK_STATUS = 'worked' as const

/** Grosze/centy z kolumny NUMERIC(12,2). */
const minorOf = (money: Money): number => Number(money.amountMinor)

/**
 * Data wystawienia. `invoice_date` jest nowsza kolumna i ma pierwszenstwo
 * przed legacy `issue_date` — tak samo czyta je eksport ksiegowy w `lib/export`.
 */
export function issueDateOf(invoice: StatementInvoiceRow): DateKey | null {
  return invoice.invoice_date ?? invoice.issue_date ?? null
}

/**
 * Okres uslugi (Leistungszeitraum).
 *
 * `null`, gdy faktura nie ma OBU granic. Podstawienie daty wystawienia
 * wygladaloby jak dane, a bylo by zgadywaniem — urzad pyta o okres
 * faktycznego wykonania, wiec luke lepiej pokazac niz zasypac.
 */
export function servicePeriodOf(invoice: StatementInvoiceRow): StatementRange | null {
  const { period_start: start, period_end: end } = invoice
  if (!start || !end) return null
  return start <= end ? { start, end } : { start: end, end: start }
}

/**
 * Kwoty faktury w groszach/centach.
 *
 * Rozbicie jest spojne z definicji (`net + vat === gross`), takze dla wierszy
 * sprzed migracji rozbicia VAT — tam `gross` bierze sie z `amount`, a VAT
 * wychodzi zerowy. Odwrotna kolejnosc (net z `amount`, gross doliczany)
 * zmienialaby kwote, ktora uzytkownik naprawde wystawil.
 */
export function amountsOf(invoice: StatementInvoiceRow): {
  currency: CURRENCY
  netMinor: number
  vatMinor: number
  grossMinor: number
} {
  const currency = invoice.currency
  const gross = fromDb(invoice.gross_amount ?? invoice.amount, currency)

  const net =
    invoice.net_amount !== null && invoice.net_amount !== undefined
      ? fromDb(invoice.net_amount, currency)
      : invoice.vat_amount !== null && invoice.vat_amount !== undefined
        ? subtract(gross, fromDb(invoice.vat_amount, currency))
        : gross

  return {
    currency,
    netMinor: minorOf(net),
    vatMinor: minorOf(subtract(gross, net)),
    grossMinor: minorOf(gross),
  }
}

/**
 * Nabywca („dla kogo").
 *
 * `recipient` z faktury wygrywa z nazwa klienta: to on stoi na wystawionym
 * dokumencie, a klient mogl w miedzyczasie zmienic nazwe. Reszta bloku
 * adresowego idzie z kartoteki klienta, bo faktura jej nie kopiuje.
 */
export function partyOf(
  invoice: StatementInvoiceRow,
  client: StatementClientRef | undefined,
): StatementParty {
  return {
    name: invoice.recipient ?? client?.name ?? null,
    address: client?.address ?? null,
    postalCode: client?.postal_code ?? null,
    city: client?.city ?? null,
    countryCode: client?.country_code ?? null,
    taxId: client?.nip ?? null,
  }
}

/** Faktura z numerem — jedyna, ktora da sie wpisac do rejestru sprzedazy. */
export type RegisteredInvoice = StatementInvoiceRow & { invoice_number: string }

/**
 * Czy faktura wchodzi do wykazu.
 *
 * Warunkiem jest NUMER: rejestr sprzedazy identyfikuje pozycje numerem, wiec
 * dokument, ktory go nie ma, nie jest jeszcze faktura. Szkice odpadaja z tego
 * samego powodu, takze gdy ktos zdazyl oznaczyc je jako oplacone.
 *
 * Faktury anulowane ZOSTAJA: bez nich w numeracji powstaje dziura, ktorej
 * ksiegowa nie umie wytlumaczyc urzedowi.
 */
export function isRegisteredInvoice(
  invoice: StatementInvoiceRow,
  now?: Date,
): invoice is RegisteredInvoice {
  return Boolean(invoice.invoice_number) && statusOf(invoice, now) !== 'DRAFT'
}

export function statusOf(invoice: StatementInvoiceRow, now?: Date): InvoiceStatus {
  return deriveInvoiceStatus(invoice, now)
}

/** Wpis pracy, ktory moze wskazac miejsce wykonania. Plan i nieobecnosci nie moga. */
export function isPerformedWork(entry: StatementEntryRow): boolean {
  return entry.status === PERFORMED_WORK_STATUS && isRealEntry(entry)
}
