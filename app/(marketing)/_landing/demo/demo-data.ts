/**
 * Dane demonstracyjne landingu — jedno zrodlo prawdy dla calej strony.
 *
 * Zasady:
 *  - model odwzorowuje `lib/types.ts` (klient, projekt, wpis, faktura),
 *  - nazwy projektow sa te same, co przypiete w sidebarze aplikacji
 *    (`app/(app)/_layout/config/nav.config.ts`),
 *  - liczby sa SPOJNE: miesiac demonstracyjny liczy sie z grafiku i wyjazdow
 *    (`_demo/demo-month.ts`), a stawka z `DEMO_RATE_EUR` — dzieki temu
 *    godziny na Pulpicie, kwota na fakturze i sekwencja „from work to money"
 *    nie moga sie rozjechac,
 *  - to sa dane JEDNEGO demonstracyjnego konta, nie statystyka platformy.
 */

export type DemoWorkType = 'hourly' | 'piecework'

export interface DemoClient {
  id: string
  name: string
  workType: DemoWorkType
  /** Stawka w EUR za godzine / sztuke. */
  rate: number
  unit: string
  /** Kolor klienta — pasek pod komorka dnia, kropka przy projekcie. */
  color: string
}

export interface DemoProject {
  id: string
  name: string
  clientId: string
  status: 'planned' | 'in_progress' | 'completed'
  statusLabel: string
  hours: number
  budgetUtilization: number
  due: string
}

/** Miesiac demonstracyjny: wrzesien 2026 zaczyna sie we wtorek. */
export const DEMO_MONTH = {
  year: 2026,
  month: 9,
  label: 'Wrzesień 2026',
  days: 30,
  /** Przesuniecie pierwszego dnia w siatce tydzien-od-poniedzialku (0 = pon). */
  firstWeekdayOffset: 1,
} as const

/** Stawka klienta, dla ktorego automat zapisuje prace. */
export const DEMO_RATE_EUR = 24

export const DEMO_CLIENTS: readonly DemoClient[] = [
  { id: 'jh',     name: 'JH Smart Solutions',  workType: 'hourly',    rate: 24, unit: 'h',   color: '#7898C5' },
  { id: 'gawlik', name: 'Gawlik & Co',         workType: 'hourly',    rate: 22, unit: 'h',   color: '#8FB89A' },
  { id: 'ignor',  name: 'Ignor Bau',           workType: 'piecework', rate: 32, unit: 'szt.', color: '#C97A8A' },
] as const

export const DEMO_PROJECTS: readonly DemoProject[] = [
  {
    id: 'winkel',
    name: 'Im Winkel 51',
    clientId: 'jh',
    status: 'in_progress',
    statusLabel: 'W trakcie',
    hours: 194,
    budgetUtilization: 62,
    due: '30 wrz 2026',
  },
  {
    id: 'boeckler',
    name: 'Hans-Böckler-Str. 284',
    clientId: 'ignor',
    status: 'planned',
    statusLabel: 'Zaplanowany',
    hours: 0,
    budgetUtilization: 0,
    due: '12 paź 2026',
  },
  {
    id: 'gustavsburger',
    name: 'Gustavsburger 25–35',
    clientId: 'gawlik',
    status: 'completed',
    statusLabel: 'Zakończony',
    hours: 168,
    budgetUtilization: 94,
    due: '29 sie 2026',
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

export const DEMO_WEEKDAY_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'] as const

/** Klucze grafiku w kolejnosci tygodnia — jak `WEEKDAY_KEYS` w automacie. */
export const DEMO_WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/**
 * Os obecnosci miesiaca: wyjazd → pobyt w domu → wyjazd. To ta sama para
 * pojec, ktora automat czyta z `resolvePresence`, tylko opisana etykietami.
 */
export const DEMO_PRESENCE = [
  { kind: 'trip', label: 'Wyjazd',       range: '1 – 12 wrz',  days: 12 },
  { kind: 'home', label: 'Pobyt w domu', range: '13 – 20 wrz', days: 8 },
  { kind: 'trip', label: 'Wyjazd',       range: '21 – 30 wrz', days: 10 },
] as const

/** Wyjazdy i pobyt w domu — dokladnie ten model, ktory czyta automat. */
export const DEMO_TRIPS = [
  { id: 'trip-1', startDate: '2026-09-01', endDate: '2026-09-12', destination: 'Wyjazd' },
  { id: 'trip-2', startDate: '2026-09-21', endDate: '2026-09-30', destination: 'Wyjazd' },
] as const

/** Okno miedzy wyjazdami — automat nie dopisuje wtedy godzin. */
export const DEMO_HOME_STAY = { startDate: '2026-09-13', endDate: '2026-09-20' } as const

export const DEMO_AUTOMATION_START = '2026-09-01'

/** Tydzien 7–13 wrzesnia: pelny tydzien wyjazdowy, 5 × 10 h + sobota 8 h. */
export const DEMO_WEEK = {
  label: 'Tydzień 37 · 7–13 wrz',
  hours: 58,
  /** Godziny dzien po dniu, od poniedzialku. */
  daily: [10, 10, 10, 10, 10, 8, 0],
} as const

/** Faktura budowana z godzin miesiaca. */
export const DEMO_INVOICE = {
  number: 'FV 09/2026',
  status: 'Szkic',
  issueDate: '30 wrz 2026',
  dueDate: '14 paź 2026',
  period: 'Wrzesień 2026',
  clientId: 'jh',
  vatRate: 0,
  vatNote: 'Odwrotne obciążenie',
} as const

/** Ostatnie faktury na Pulpicie — kwoty wynikaja z godzin i stawki. */
export const DEMO_INVOICES = [
  { number: 'FV 09/2026', status: 'Szkic',    hours: 194, amountEur: 194 * DEMO_RATE_EUR },
  { number: 'FV 08/2026', status: 'Wysłana',  hours: 168, amountEur: 168 * DEMO_RATE_EUR },
  { number: 'FV 07/2026', status: 'Opłacona', hours: 210, amountEur: 210 * DEMO_RATE_EUR },
] as const

/** Slupki „Godziny w miesiacu" na Raportach — sierpien … wrzesien 2026. */
export const DEMO_MONTHLY_HOURS = [
  { label: 'Kwi', hours: 176 },
  { label: 'Maj', hours: 202 },
  { label: 'Cze', hours: 188 },
  { label: 'Lip', hours: 210 },
  { label: 'Sie', hours: 168 },
  { label: 'Wrz', hours: 194 },
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
  /** Etykieta powodu pominiecia — dokladnie ta z aplikacji. */
  skipLabel: string | null
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
  if (!client) throw new Error(`Nieznany klient demo: ${id}`)
  return client
}

export function demoProject(id: string): DemoProject {
  const project = DEMO_PROJECTS.find((entry) => entry.id === id)
  if (!project) throw new Error(`Nieznany projekt demo: ${id}`)
  return project
}
