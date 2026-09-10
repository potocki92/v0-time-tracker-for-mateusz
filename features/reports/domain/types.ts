import type { CURRENCY, WorkEntry } from '@/lib/types'
import type { BillingWorkType } from '@/lib/finance/entry-calculations'

/**
 * Kontrakty modulu Raporty. Jeden plik z typami, zeby data flow
 * (wiersz z Supabase → rekord → model widoku) dalo sie przeczytac w calosci.
 *
 * Konwencje:
 *  • data kalendarzowa to ZAWSZE `DateKey` ("YYYY-MM-DD"), nigdy `Date`,
 *  • pieniadze to ZAWSZE grosze/centy (int), nigdy float,
 *  • `*BaseMinor` znaczy „przeliczone na walute raportu" (patrz REPORT_BASE_CURRENCY).
 */

/** Data kalendarzowa "YYYY-MM-DD". Porownanie zakresow to leksykograficzne `>=`/`<=`. */
export type DateKey = string

/**
 * Waluta, w ktorej raport podaje wartosc pracy. Wpisy w EUR sa przeliczane
 * kursem konta (`profiles.eur_to_pln`) — inaczej suma mieszalaby jednostki.
 */
export const REPORT_BASE_CURRENCY: CURRENCY = 'PLN'

/** Wartosc filtra „wszystko" dla klienta/projektu/tagu. */
export const ALL = 'all'

export type ReportPeriodPreset =
  | 'last7d'
  | 'last30d'
  | 'last90d'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'custom'

export type ReportFilters = {
  preset: ReportPeriodPreset
  /** Uzywane wylacznie przy `preset === 'custom'`. */
  from: DateKey
  to: DateKey
  /** `ALL` albo id klienta. */
  clientId: string
  /** `ALL` albo id projektu. */
  projectId: string
  /** `ALL` albo nazwa tagu. */
  tag: string
  compare: boolean
}

/** Zakres domkniety obustronnie: `start` i `end` naleza do okresu. */
export type ReportRange = {
  start: DateKey
  end: DateKey
}

// ── Warstwa transportowa (Supabase → route handler → React Query) ────────────

/** Kolumny `work_entries`, ktorych raport naprawde uzywa. */
export type ReportEntryRow = Pick<
  WorkEntry,
  | 'id'
  | 'client_id'
  | 'project_id'
  | 'date'
  | 'status'
  | 'entry_kind'
  | 'source'
  | 'hours'
  | 'quantity'
  | 'quantity_from'
  | 'quantity_to'
  | 'tags'
  | 'billing_rate'
  | 'billing_currency'
  | 'billing_work_type'
  | 'billing_unit'
>

/** Klient w roli fallbacku rozliczenia i etykiety — bez bloku adresowego. */
export type ReportClientRef = Pick<
  import('@/lib/types').Client,
  'id' | 'name' | 'rate' | 'currency' | 'work_type'
>

/** Projekt w roli etykiety i kaskady „klient → jego projekty". */
export type ReportProjectRef = Pick<import('@/lib/types').Project, 'id' | 'name' | 'client_id'>

export type ReportsDataset = {
  /** Okno, ktore serwer naprawde pobral (szersze niz zakres raportu, gdy wlaczony compare). */
  window: ReportRange
  entries: ReportEntryRow[]
  clients: ReportClientRef[]
  projects: ReportProjectRef[]
  /** Kurs EUR→PLN uzyty do wyrazenia wartosci pracy w walucie raportu. */
  eurRate: number
}

// ── Warstwa domenowa ─────────────────────────────────────────────────────────

/**
 * Wpis pracy po normalizacji: pieniadze policzone RAZ, etykiety rozwiazane RAZ.
 * Wszystkie agregacje raportu jada na tej strukturze, wiec zaden komponent nie
 * musi juz siegac po `lib/finance` ani po mape klientow.
 */
export type ReportRecord = {
  id: string
  date: DateKey
  clientId: string | null
  /** Nazwa klienta — dana uzytkownika, nigdy nie tlumaczona. `null` = brak przypisania. */
  clientName: string | null
  projectId: string | null
  projectName: string | null
  hours: number
  /** Ilosc akordowa; 0 dla rozliczenia godzinowego. */
  quantity: number
  workType: BillingWorkType
  /** Stawka faktycznie zastosowana (wpis albo fallback do klienta), w groszach/centach. */
  appliedRateMinor: number
  appliedCurrency: CURRENCY
  /** Wartosc pracy w walucie wpisu. */
  valueMinor: number
  /** Ta sama wartosc przeliczona na walute raportu. */
  valueBaseMinor: number
  /** Czy wpis ma dodatnia stawke po uwzglednieniu fallbacku do klienta. */
  billable: boolean
  tags: string[]
  source: 'manual' | 'automation'
}

export type ReportKpis = {
  totalHours: number
  /** Wartosc wykonanej pracy w walucie raportu. NIE jest to przychod z faktur. */
  workValueMinor: number
  activeDays: number
  avgHoursPerActiveDay: number
  /** `workValueMinor / totalHours`; `null` gdy brak godzin (sam akord albo pusty okres). */
  effectiveHourlyRateMinor: number | null
  /** Udzial godzin rozliczanych, 0..1; `null` gdy brak godzin. */
  billableRatio: number | null
  entryCount: number
}

export type MetricTrendStatus = 'up' | 'down' | 'flat' | 'new' | 'empty'

/**
 * Zmiana metryki wzgledem poprzedniego okresu.
 *
 * `ratio` jest `null`, gdy poprzednia wartosc to 0 — procent nie istnieje
 * matematycznie i pokazanie „0%" byloby klamstwem. UI czyta wtedy `status`:
 * `new` (bylo 0, jest cos) albo `empty` (bylo 0 i jest 0).
 */
export type MetricDelta = {
  current: number
  previous: number
  absolute: number
  ratio: number | null
  status: MetricTrendStatus
}

export type ComparableMetric =
  | 'totalHours'
  | 'workValue'
  | 'activeDays'
  | 'avgHoursPerActiveDay'
  | 'effectiveHourlyRate'
  | 'billableRatio'

export type ReportComparison = {
  previousRange: ReportRange
  previousKpis: ReportKpis
  deltas: Record<ComparableMetric, MetricDelta>
}

export type TrendBucketUnit = 'day' | 'week' | 'month'

export type TrendPoint = {
  /** Klucz kubelka: "2026-09-07" | "2026-W37" | "2026-09". */
  key: string
  start: DateKey
  end: DateKey
  hours: number
  valueBaseMinor: number
  /** Wartosci z rownolegle polozonego kubelka poprzedniego okresu; `null` gdy compare wylaczony. */
  previousHours: number | null
  previousValueBaseMinor: number | null
}

export type ReportTrend = {
  unit: TrendBucketUnit
  points: TrendPoint[]
}

export type BreakdownDimension = 'client' | 'project' | 'tag'

export type BreakdownItem = {
  key: string
  /** Nazwa klienta/projektu/tagu — dana uzytkownika. `null` = brak przypisania, UI podstawia etykiete z i18n. */
  label: string | null
  hours: number
  /** Udzial w godzinach okresu, 0..1. */
  share: number
  valueBaseMinor: number
  effectiveHourlyRateMinor: number | null
  entryCount: number
}

/** Poniedzialek = 0 … niedziela = 6. */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type WeekdayLoad = {
  weekday: WeekdayIndex
  hours: number
  /** Ile razy ten dzien tygodnia byl dniem z praca. */
  activeDays: number
  /** Ile razy ten dzien tygodnia wystapil w zakresie (mianownik sredniej). */
  occurrences: number
}

export type ReportInsights = {
  spanDays: number
  weekdayLoad: WeekdayLoad[]
  busiestWeekday: WeekdayIndex | null
  /** Najdluzsza seria kolejnych dni kalendarzowych z praca. */
  longestStreakDays: number
  longestDay: { date: DateKey; hours: number } | null
  daysWithoutWork: number
}

/** Jeden dzien heatmapy. `level` to indeks w `HEATMAP_LEVELS` (0 = brak pracy). */
export type HeatmapDay = {
  date: DateKey
  hours: number
  level: 0 | 1 | 2 | 3 | 4
}

/**
 * Kompletny model widoku raportu. Komponenty dostaja gotowe liczby —
 * nie filtruja, nie sumuja i nie przeliczaja walut.
 */
export type ReportModel = {
  range: ReportRange
  spanDays: number
  currency: CURRENCY
  eurRate: number
  records: ReportRecord[]
  kpis: ReportKpis
  comparison: ReportComparison | null
  trend: ReportTrend
  breakdowns: Record<BreakdownDimension, BreakdownItem[]>
  insights: ReportInsights
  /** `null`, gdy zakres jest za krotki, zeby heatmapa cokolwiek wnosila. */
  heatmap: HeatmapDay[] | null
  /** Tagi obecne w pobranym oknie — zrodlo opcji filtra. */
  availableTags: string[]
  /** Pobrane okno nie zawiera ANI JEDNEGO wpisu wykonanej pracy (pusty stan „zacznij pracowac"). */
  datasetIsEmpty: boolean
}
