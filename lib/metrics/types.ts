/** Kwoty wyłącznie w groszach/centach (int). Zero floatów w domenie pieniędzy. */
export type Minor = number
export type CurrencyCode = 'PLN' | 'EUR'
/** Data kalendarzowa "YYYY-MM-DD" w strefie Europe/Warsaw. Nigdy Date w kontrakcie. */
export type IsoDate = string

export type DayKind = 'worked' | 'vacation' | 'sick' | 'dayOff' | 'weekend' | 'empty'

export interface WorkEntryInput {
  date: IsoDate
  hours: number
  projectId: string
  clientId: string | null
  /** stawka godzinowa obowiązująca dla tego wpisu */
  rateMinor: Minor | null
  /**
   * Kwota wpisu w jego walucie, gdy nie wynika z `rateMinor × hours` (akord).
   * `null` → kwota liczona jako `rateMinor × hours`.
   */
  amountMinor: Minor | null
  currency: CurrencyCode
  /** `real` = potwierdzone, `predicted` = zaplanowane ręcznie przez użytkownika */
  kind: 'real' | 'predicted'
}

export interface AbsenceInput {
  date: IsoDate
  kind: Extract<DayKind, 'vacation' | 'sick' | 'dayOff'>
}

export interface MetricsSettings {
  /** norma dzienna w godzinach, używana do planu i prognozy */
  dailyNormHours: number
  /** cel godzinowy: "manual" = stała wartość, "businessDays" = dni robocze × dailyNormHours */
  hoursGoalMode: 'manual' | 'businessDays'
  manualHoursGoal: number | null
  earningsGoalMinor: Minor | null
  displayCurrency: CurrencyCode
  /** czy urlop/L4 przerywa serię */
  absenceBreaksStreak: boolean
  /** kurs EUR→PLN w punktach bazowych (1/10 000): 4,30 zł → 43000 */
  eurRateBps: number
}

/**
 * Okno kalendarzowe metryk. Miesiąc to przypadek szczególny (`monthPeriod`),
 * ale Pulpit liczy też tygodnie, kwartały i lata — dlatego kontrakt bierze
 * okno, a nie sam miesiąc.
 */
export interface MetricsPeriod {
  from: IsoDate
  to: IsoDate
  /** etykieta okna — dla pełnego miesiąca "YYYY-MM" */
  label: string
}

export interface MonthMetricsInput {
  period: MetricsPeriod
  today: IsoDate           // wstrzykiwane, NIGDY new Date() wewnątrz funkcji
  /**
   * Wpisy obejmujące CO NAJMNIEJ okno. Agregaty okna liczą się wyłącznie
   * z wpisów wewnątrz `period`; serie (`currentStreakDays`, `longestStreakDays`)
   * czytają całą tablicę, bo seria nie kończy się na granicy miesiąca.
   */
  entries: WorkEntryInput[]
  absences: AbsenceInput[]
  settings: MetricsSettings
}

export interface HoursMetrics {
  /** faktycznie zarejestrowane do dziś włącznie */
  actual: number
  /** godziny z wpisów zaplanowanych + pozostałe puste dni robocze × dailyNormHours */
  planned: number
  /** actual + planned */
  forecast: number
  goal: number
  /** actual/goal, 0..n, bez zaokrągleń do 100% */
  goalProgress: number
  overtime: number
  /** actual / liczba zrealizowanych dni pracy (nie `days.worked`, które obejmuje też plan) */
  avgPerWorkedDay: number | null
}

export interface EarningsMetrics {
  actualMinor: Minor
  /**
   * Kwota z wpisów zaplanowanych. Pustym dniom roboczym NIE dopisujemy kwoty —
   * nie znamy dla nich stawki, a zgadywanie zafałszowałoby prognozę.
   * Dlatego `plannedMinor` nie odpowiada 1:1 `hours.planned`.
   */
  plannedMinor: Minor
  forecastMinor: Minor
  goalMinor: Minor | null
  goalProgress: number | null
  bestDay: { date: IsoDate; amountMinor: Minor } | null
  avgPerWorkedDayMinor: Minor | null
  currency: CurrencyCode
}

/** Suma sześciu kubełków MUSI równać się `totalDays`. Kubełki są rozłączne. */
export interface DayBreakdown {
  totalDays: number
  worked: number
  vacation: number
  sick: number
  dayOff: number
  /** weekendy BEZ wpisu — weekend z wpisem liczy się jako worked */
  weekendIdle: number
  /** dni robocze bez wpisu i bez nieobecności */
  weekdayIdle: number
}

export interface MonthMetrics {
  period: MetricsPeriod
  today: IsoDate
  hours: HoursMetrics
  earnings: EarningsMetrics
  days: DayBreakdown
  /** dni pracy potwierdzone do dziś — podzbiór `days.worked` */
  realizedWorkedDays: number
  /** dni składające się na plan: dni z wpisem zaplanowanym + puste dni robocze po dziś */
  plannedDays: number
  /** null gdy brak godzin rozliczalnych — UI ma renderować "—", nigdy 0,00 */
  effectiveRateMinorPerHour: Minor | null
  /** JEDNA definicja: kolejne dni z wpisem liczone wstecz od `today`;
   *  jeśli `today` nie ma wpisu, liczymy od dnia poprzedniego. */
  currentStreakDays: number
  longestStreakDays: number
  byProject: Array<{ projectId: string; hours: number; amountMinor: Minor; shareOfMonth: number }>
  /** ten sam podział co `byProject`, tylko po kliencie — Pulpit rozbija stawkę per klient */
  byClient: Array<{ clientId: string | null; hours: number; amountMinor: Minor; shareOfMonth: number }>
  byWeek: Array<{ isoWeek: string; hours: number; amountMinor: Minor }>
}
