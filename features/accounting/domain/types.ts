import type { AppLocale } from '@/i18n/config'
import type { InvoiceStatus } from '@/lib/finance/invoice-status'
import type { CURRENCY, Client, Invoice, Project, WorkEntry } from '@/lib/types'

/**
 * Kontrakty modulu „Wykaz dla ksiegowej".
 *
 * Modul odpowiada na jedno pytanie urzedu skarbowego (Finanzamt przy
 * rozliczeniu rocznym): JAKIE faktury zostaly wystawione, ZA JAKI okres,
 * DLA KOGO i GDZIE praca zostala wykonana.
 *
 * Konwencje — te same, co w reszcie repo:
 *  • data kalendarzowa to ZAWSZE `DateKey` ("YYYY-MM-DD"), nigdy `Date`,
 *  • pieniadze to ZAWSZE grosze/centy (int), nigdy float; sufiks `Minor`,
 *  • kwoty NIE sa przeliczane miedzy walutami — kazda waluta ma wlasna sume.
 */

/** Data kalendarzowa "YYYY-MM-DD". Porownanie zakresow to leksykograficzne `>=`/`<=`. */
export type DateKey = string

/** Zakres domkniety obustronnie: `start` i `end` naleza do okresu. */
export type StatementRange = {
  start: DateKey
  end: DateKey
}

/** Wartosc filtra „wszyscy klienci". */
export const ALL = 'all'

/**
 * Presety zakresu. Rozliczenie roczne idzie za ROKIEM PODATKOWYM, wiec lista
 * jest krotsza niz w raporcie pracy — nie ma tu „ostatnich 7 dni".
 */
export type StatementPeriodPreset =
  | 'thisYear'
  | 'lastYear'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'custom'

export type StatementFilters = {
  preset: StatementPeriodPreset
  /** Uzywane wylacznie przy `preset === 'custom'`. */
  from: DateKey
  to: DateKey
  /** `ALL` albo id klienta. */
  clientId: string
  /**
   * Jezyk DOKUMENTU — os niezalezna od jezyka interfejsu.
   * Polski uzytkownik generuje niemiecki wykaz dla swojej ksiegowej,
   * nie przelaczajac przy tym calej aplikacji (patrz `docs/i18n.md`, sekcja 15).
   */
  documentLocale: AppLocale
}

// ── Warstwa transportowa (Supabase → route handler → React Query) ────────────

/** Kolumny `invoices`, ktorych wykaz naprawde uzywa. */
export type StatementInvoiceRow = Pick<
  Invoice,
  | 'id'
  | 'client_id'
  | 'invoice_number'
  | 'recipient'
  | 'description'
  | 'issue_date'
  | 'invoice_date'
  | 'due_date'
  | 'period_start'
  | 'period_end'
  | 'amount'
  | 'net_amount'
  | 'vat_amount'
  | 'gross_amount'
  | 'currency'
  | 'is_paid'
  | 'paid_date'
  | 'status'
>

/**
 * Klient w roli NABYWCY. W odroznieniu od raportu pracy potrzebny jest tu
 * caly blok adresowy i identyfikator podatkowy — to one odpowiadaja na
 * pytanie „dla kogo".
 */
export type StatementClientRef = Pick<
  Client,
  'id' | 'name' | 'nip' | 'address' | 'city' | 'postal_code' | 'country_code'
>

/** Projekt w roli MIEJSCA wykonywania pracy (`projects.address`). */
export type StatementProjectRef = Pick<Project, 'id' | 'name' | 'client_id' | 'address'>

/** Wpis pracy — tylko tyle, ile trzeba, zeby zlokalizowac okres faktury. */
export type StatementEntryRow = Pick<
  WorkEntry,
  'id' | 'client_id' | 'project_id' | 'date' | 'status' | 'entry_kind' | 'hours'
>

export type AccountingDataset = {
  /** Zakres wykazu — po dacie wystawienia faktury. */
  range: StatementRange
  /** Okno wpisow pracy: zakres poszerzony o okresy uslug fakturowanych w zakresie. */
  workWindow: StatementRange
  invoices: StatementInvoiceRow[]
  entries: StatementEntryRow[]
  clients: StatementClientRef[]
  projects: StatementProjectRef[]
}

// ── Warstwa domenowa ─────────────────────────────────────────────────────────

/** Nabywca uslugi — komplet danych, ktorego wymaga wykaz („dla kogo"). */
export type StatementParty = {
  /** Nazwa z faktury (`recipient`) albo nazwa klienta. Dana uzytkownika — nigdy nie tlumaczona. */
  name: string | null
  address: string | null
  postalCode: string | null
  city: string | null
  /** ISO 3166-1 alpha-2, np. "DE". */
  countryCode: string | null
  /** NIP / USt-IdNr. */
  taxId: string | null
}

/**
 * Jedno miejsce wykonywania pracy w okresie faktury („gdzie").
 *
 * Zrodlem adresu jest `projects.address`, bo to projekt niesie miejsce pracy.
 * Faktura nie ma wlasnego adresu wykonania i nie powinna go mieć — to samo
 * miejsce moze trafic na kilka faktur.
 */
export type StatementWorksite = {
  projectId: string | null
  /** Nazwa projektu — dana uzytkownika. `null` = wpisy bez projektu. */
  projectName: string | null
  /** Adres projektu. `null`, gdy projekt go nie ma. */
  location: string | null
  /** Pierwszy i ostatni dzien Z PRACA w tym projekcie WEWNATRZ okresu faktury. */
  from: DateKey
  to: DateKey
  /** Liczba ROZNYCH dni z praca. */
  workedDays: number
  hours: number
}

/**
 * Jedna faktura jako wiersz wykazu.
 *
 * Kwoty sa spojne z definicji: `netMinor + vatMinor === grossMinor`, takze
 * dla faktur sprzed wprowadzenia rozbicia VAT (wtedy VAT = 0).
 */
export type StatementRow = {
  id: string
  /** Zawsze ustawiony: dokument bez numeru nie wchodzi do rejestru (patrz `draftCount`). */
  invoiceNumber: string
  /** Zawsze ustawiona: rejestr jest zawezony wlasnie po tej dacie. */
  issueDate: DateKey
  dueDate: DateKey | null
  paidDate: DateKey | null
  status: InvoiceStatus
  /**
   * Okres uslugi („od–do"). `null`, gdy faktura go nie ma — wykaz pokazuje
   * wtedy luke zamiast podstawiac date wystawienia.
   */
  period: StatementRange | null
  party: StatementParty
  /** Opis uslugi z faktury. */
  description: string | null
  currency: CURRENCY
  netMinor: number
  vatMinor: number
  grossMinor: number
  /** Miejsca pracy z okresu faktury. Puste, gdy brak okresu albo brak wpisow. */
  worksites: StatementWorksite[]
  /** Liczba ROZNYCH dni z praca w okresie faktury (nie suma kolumny miejsc). */
  workedDays: number
  hours: number
}

/** Suma w JEDNEJ walucie. Walut nie przelicza sie kursem — to byloby zmyslenie kwoty. */
export type StatementCurrencyTotal = {
  currency: CURRENCY
  invoiceCount: number
  netMinor: number
  vatMinor: number
  grossMinor: number
  paidGrossMinor: number
  unpaidGrossMinor: number
}

/** Suma kwartalna — ksiegowa rozlicza zaliczki kwartalnie. */
export type StatementQuarterTotal = {
  /** "2026-Q1". */
  key: string
  year: number
  quarter: 1 | 2 | 3 | 4
  currency: CURRENCY
  invoiceCount: number
  netMinor: number
  vatMinor: number
  grossMinor: number
}

/**
 * Kompletny model wykazu. Komponenty i szablony PDF dostaja gotowe liczby —
 * nie filtruja, nie sumuja i nie siegaja po `lib/finance`.
 */
export type StatementModel = {
  range: StatementRange
  rows: StatementRow[]
  totals: StatementCurrencyTotal[]
  quarters: StatementQuarterTotal[]
  /** Ile faktur z zakresu nie ma okresu uslugi — dziura do uzupelnienia przed wyslaniem. */
  missingPeriodCount: number
  /** Ile wierszy nie ma ANI JEDNEGO zarejestrowanego miejsca pracy. */
  missingLocationCount: number
  /** Ile dokumentow pominieto jako szkice albo faktury bez numeru. */
  draftCount: number
  /** Zakres nie zawiera ANI JEDNEJ faktury. */
  datasetIsEmpty: boolean
}
