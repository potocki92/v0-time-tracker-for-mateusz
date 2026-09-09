/**
 * Dane demonstracyjne landingu — jedno zrodlo prawdy dla calej strony.
 *
 * Zasady:
 *  - model odwzorowuje `lib/types.ts` (klient, projekt, wpis, faktura),
 *  - nazwy projektow sa te same, co przypiete w sidebarze aplikacji
 *    (`app/[locale]/(app)/_layout/config/nav.config.ts`),
 *  - liczby sa SPOJNE: miesiac demonstracyjny liczy sie z grafiku i wyjazdow
 *    (`demo-month.server.ts`), a stawka z `DEMO_RATE_EUR` — dzieki temu
 *    godziny na Pulpicie, kwota na fakturze i sekwencja „od pracy do pieniedzy"
 *    nie moga sie rozjechac,
 *  - to sa dane JEDNEGO demonstracyjnego konta, nie statystyka platformy.
 *
 * I18N: ten plik nie zawiera ANI JEDNEJ etykiety dla uzytkownika. Daty siedza
 * jako `YYYY-MM-DD` i przechodza przez `lib/format`, a statusy i typy jako
 * KLUCZE tlumaczone w komponentach. Dzieki temu niemiecki landing nie moze
 * pokazac polskiego „Zaplanowany" ani polskiego „30 wrz 2026".
 */

export type DemoWorkType = 'hourly' | 'piecework'

export interface DemoClient {
  id: string
  name: string
  workType: DemoWorkType
  /** Stawka w EUR za godzine / sztuke. */
  rate: number
  /** Kolor klienta — pasek pod komorka dnia, kropka przy projekcie. */
  color: string
}

export type DemoProjectStatus = 'planned' | 'in_progress' | 'completed'

export interface DemoProject {
  id: string
  name: string
  clientId: string
  status: DemoProjectStatus
  hours: number
  budgetUtilization: number
  /** Termin jako data kalendarzowa — etykiete robi `lib/format`. */
  dueDate: string
}

/** Miesiac demonstracyjny: wrzesien 2026 zaczyna sie we wtorek. */
export const DEMO_MONTH = {
  year: 2026,
  month: 9,
  /** Klucz miesiaca dla formatterow ("Wrzesień 2026" / "September 2026"). */
  iso: '2026-09',
  days: 30,
  /** Przesuniecie pierwszego dnia w siatce tydzien-od-poniedzialku (0 = pon). */
  firstWeekdayOffset: 1,
} as const

/** Stawka klienta, dla ktorego automat zapisuje prace. */
export const DEMO_RATE_EUR = 24

export const DEMO_CLIENTS: readonly DemoClient[] = [
  { id: 'jh',     name: 'JH Smart Solutions',  workType: 'hourly',    rate: 24, color: '#7898C5' },
  { id: 'gawlik', name: 'Gawlik & Co',         workType: 'hourly',    rate: 22, color: '#8FB89A' },
  { id: 'ignor',  name: 'Ignor Bau',           workType: 'piecework', rate: 32, color: '#C97A8A' },
] as const

export const DEMO_PROJECTS: readonly DemoProject[] = [
  {
    id: 'winkel',
    name: 'Im Winkel 51',
    clientId: 'jh',
    status: 'in_progress',
    hours: 194,
    budgetUtilization: 62,
    dueDate: '2026-09-30',
  },
  {
    id: 'boeckler',
    name: 'Hans-Böckler-Str. 284',
    clientId: 'ignor',
    status: 'planned',
    hours: 0,
    budgetUtilization: 0,
    dueDate: '2026-10-12',
  },
  {
    id: 'gustavsburger',
    name: 'Gustavsburger 25–35',
    clientId: 'gawlik',
    status: 'completed',
    hours: 168,
    budgetUtilization: 94,
    dueDate: '2026-08-29',
  },
] as const

/** Projekt i klient, na ktore automat zapisuje godziny w demo. */
export const DEMO_AUTOMATION_TARGET = {
  clientId: 'jh',
  projectId: 'winkel',
} as const

/**
 * Grafik tygodnia — kopia `DEFAULT_WEEK_SCHEDULE` z automatu.
 * Kopia, nie import: bariera z `@/features/work-automation/domain` ciagnie za
 * soba zod, ktory nie ma czego szukac w bundlu marketingowym. Zgodnosc obu
 * wartosci pilnuje test `__test__/landing/landing.test.ts`.
 */
export const DEMO_WEEK_SCHEDULE = {
  mon: { enabled: true,  hours: 10 },
  tue: { enabled: true,  hours: 10 },
  wed: { enabled: true,  hours: 10 },
  thu: { enabled: true,  hours: 10 },
  fri: { enabled: true,  hours: 10 },
  sat: { enabled: true,  hours: 8 },
  sun: { enabled: false, hours: 8 },
} as const

/** Klucze grafiku w kolejnosci tygodnia — jak `WEEKDAY_KEYS` w automacie. */
export const DEMO_WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/**
 * Tydzien odniesienia dla nazw dni: 2026-09-07 to poniedzialek. Etykiety
 * ("Pon"/"Mo"/"Mon") robi `lib/format` z jezyka interfejsu — nie ma tu
 * zadnej listy zaszytej po polsku.
 */
export const DEMO_WEEKDAY_DATES = [
  '2026-09-07',
  '2026-09-08',
  '2026-09-09',
  '2026-09-10',
  '2026-09-11',
  '2026-09-12',
  '2026-09-13',
] as const

export type DemoPresenceKind = 'trip' | 'home'

/**
 * Os obecnosci miesiaca: wyjazd → pobyt w domu → wyjazd. To ta sama para
 * pojec, ktora automat czyta z `resolvePresence`.
 */
export const DEMO_PRESENCE = [
  { kind: 'trip', from: '2026-09-01', to: '2026-09-12', days: 12 },
  { kind: 'home', from: '2026-09-13', to: '2026-09-20', days: 8 },
  { kind: 'trip', from: '2026-09-21', to: '2026-09-30', days: 10 },
] as const satisfies readonly { kind: DemoPresenceKind; from: string; to: string; days: number }[]

/** Wyjazdy i pobyt w domu — dokladnie ten model, ktory czyta automat. */
export const DEMO_TRIPS = [
  { id: 'trip-1', startDate: '2026-09-01', endDate: '2026-09-12', destination: 'Im Winkel 51' },
  { id: 'trip-2', startDate: '2026-09-21', endDate: '2026-09-30', destination: 'Im Winkel 51' },
] as const

/** Okno miedzy wyjazdami — automat nie dopisuje wtedy godzin. */
export const DEMO_HOME_STAY = { startDate: '2026-09-13', endDate: '2026-09-20' } as const

export const DEMO_AUTOMATION_START = '2026-09-01'

/** Tydzien 7–13 wrzesnia: pelny tydzien wyjazdowy, 5 × 10 h + sobota 8 h. */
export const DEMO_WEEK = {
  /** Dowolny dzien tygodnia — numer KW i zakres licza sie z niego. */
  anchorDate: '2026-09-07',
  from: '2026-09-07',
  to: '2026-09-13',
  hours: 58,
  /** Godziny dzien po dniu, od poniedzialku. */
  daily: [10, 10, 10, 10, 10, 8, 0],
} as const

export type DemoInvoiceStatus = 'draft' | 'sent' | 'paid'

/** Faktura budowana z godzin miesiaca. */
export const DEMO_INVOICE = {
  number: 'FV 09/2026',
  status: 'draft' as DemoInvoiceStatus,
  issueDate: '2026-09-30',
  dueDate: '2026-10-14',
  clientId: 'jh',
  vatRate: 0,
} as const

export interface DemoInvoiceRow {
  number: string
  status: DemoInvoiceStatus
  hours: number
  amountEur: number
}

/** Ostatnie faktury na Pulpicie — kwoty wynikaja z godzin i stawki. */
export const DEMO_INVOICES: readonly DemoInvoiceRow[] = [
  { number: 'FV 09/2026', status: 'draft', hours: 194, amountEur: 194 * DEMO_RATE_EUR },
  { number: 'FV 08/2026', status: 'sent',  hours: 168, amountEur: 168 * DEMO_RATE_EUR },
  { number: 'FV 07/2026', status: 'paid',  hours: 210, amountEur: 210 * DEMO_RATE_EUR },
]

/** Slupki „Godziny w miesiacu" na Raportach — kwiecien … wrzesien 2026. */
export const DEMO_MONTHLY_HOURS = [
  { month: '2026-04', hours: 176 },
  { month: '2026-05', hours: 202 },
  { month: '2026-06', hours: 188 },
  { month: '2026-07', hours: 210 },
  { month: '2026-08', hours: 168 },
  { month: '2026-09', hours: 194 },
] as const

/**
 * Jeden dzien miesiaca demonstracyjnego. Wypelnia go `buildDemoMonth()` na
 * serwerze — tutaj stoi sam kontrakt, zeby komponenty klienckie mogly go
 * importowac bez dotykania modulu server-only.
 */
export interface DemoDay {
  /** Dzien miesiaca, 1..30. */
  day: number
  /** 0 = poniedzialek. */
  weekday: number
  /** Godziny dopisane przez automat albo `null`, gdy dzien zostal pominiety. */
  hours: number | null
  /**
   * Powod pominiecia jako KLUCZ domeny automatu (`SkipReason`), nie gotowa
   * etykieta — tlumaczy go `marketing.automation.skipReasons.<reason>`.
   */
  skipReason: string | null
  /** Czy dzien nalezy do wyjazdu (praca poza domem). */
  inTrip: boolean
}

export interface DemoMonth {
  days: DemoDay[]
  totalHours: number
  earningsEur: number
  workedDays: number
}

export function demoClient(id: string): DemoClient {
  const client = DEMO_CLIENTS.find((entry) => entry.id === id)
  if (!client) throw new Error(`Unknown demo client: ${id}`)
  return client
}

export function demoProject(id: string): DemoProject {
  const project = DEMO_PROJECTS.find((entry) => entry.id === id)
  if (!project) throw new Error(`Unknown demo project: ${id}`)
  return project
}
