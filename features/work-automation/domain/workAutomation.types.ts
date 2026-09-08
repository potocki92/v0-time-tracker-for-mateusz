/**
 * Typy automatu zapisujacego RZECZYWISTE przepracowane dni.
 *
 * Slownik pojec (pelny opis: docs/work-automation.md):
 * - „godzina zapisu" to moment DOPISANIA ustalonej liczby godzin za dany dzien,
 *   nie godzina rozpoczecia pracy,
 * - „pobyt w domu" to okres miedzy powrotem z wyjazdu a kolejnym wyjazdem albo
 *   jawnym wznowieniem pracy — automat nie dopisuje wtedy godzin,
 * - „wersja konfiguracji" to snapshot ustawien obowiazujacy od danej chwili;
 *   nadrabianie zaleglosci czyta wersje z danej daty, nie dzisiejsza.
 */

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface WeekdayPlan {
  enabled: boolean
  hours: number
}

export type WeekSchedule = Record<WeekdayKey, WeekdayPlan>

/** Konfiguracja automatu — to samo, co trafia do snapshotu wersji. */
export interface WorkAutomationConfig {
  enabled: boolean
  /** Pierwszy dzien, ktory automat moze rozpatrzec ("YYYY-MM-DD"). */
  startDate: string
  /** Godzina zapisu w formacie "HH:mm", w strefie `timeZone`. */
  runTime: string
  /** Strefa IANA, np. "Europe/Warsaw". */
  timeZone: string
  weekSchedule: WeekSchedule
  clientId: string
  /** Pusty string = bez projektu. */
  projectId: string
}

export type AutomationDisabledReason = 'client_deleted' | 'project_deleted'

export interface WorkAutomationSettings extends WorkAutomationConfig {
  /** Ustawione, gdy automat wylaczyl SYSTEM (usuniety klient albo projekt). */
  disabledReason: AutomationDisabledReason | null
}

/** Zakres dat wyjazdu — obie granice wlacznie. */
export interface DateRange {
  startDate: string
  endDate: string
}

export type PresenceState =
  | { at: 'work'; because: 'trip' | 'resumption' | 'no_trips' | 'archived_trips_only' }
  | { at: 'home'; because: 'between_trips' | 'awaiting_first_trip' | 'after_return' }

export type SkipReason =
  | 'before_start'
  | 'home_stay'
  | 'weekday_off'
  | 'entry_exists'
  | 'automation_disabled'
  | 'not_due_yet'
  | 'already_decided'
  | 'unknown_settings'

export type ErrorReason =
  | 'trips_unavailable'
  | 'entries_unavailable'
  | 'client_missing'
  | 'client_not_hourly'
  | 'project_mismatch'
  | 'insert_failed'

export type DayDecision =
  | { action: 'create'; date: string; hours: number }
  | { action: 'skip'; date: string; reason: SkipReason }

export interface ExistingEntry {
  entryKind: 'real' | 'predicted'
}

export interface DayDecisionInput {
  /** Data lokalna uzytkownika, "YYYY-MM-DD". */
  date: string
  weekSchedule: WeekSchedule
  /** `startDate` wersji konfiguracji obowiazujacej dla tej daty. */
  activationDate: string
  trips: readonly DateRange[]
  /** Daty jawnych wznowien pracy ("YYYY-MM-DD"). */
  resumptions: readonly string[]
  /** Wpisy istniejace juz dla tej daty — decyduje tylko ich rodzaj. */
  existingEntries: readonly ExistingEntry[]
}

/** Wynik pojedynczego przebiegu zadania dla jednego uzytkownika. */
export interface RunOutcome {
  userId: string
  created: number
  skipped: number
  failed: number
  decisions: RunDecisionRecord[]
}

export interface RunDecisionRecord {
  localDate: string
  outcome: 'created' | 'skipped' | 'error'
  reason: SkipReason | ErrorReason | 'created'
  hours: number | null
  entryId: string | null
  configVersionId: string | null
}

/** Wiersz dziennika decyzji wzbogacony o moment rozstrzygniecia. */
export interface RunRecord extends RunDecisionRecord {
  decidedAt: string
}

export interface AutomationClientOption {
  id: string
  name: string
  workType: 'hourly' | 'piecework'
}

export interface AutomationProjectOption {
  id: string
  name: string
  clientId: string
}

export interface AutomationPreviewDay {
  date: string
  weekday: WeekdayKey
  hours: number | null
  reason: SkipReason | null
}

/** Najblizszy zapis opisany w strefie uzytkownika — data i godzina scienna. */
export interface NextRun {
  date: string
  time: string
}

/** Komplet danych sekcji ustawien; sklada go warstwa serwerowa. */
export interface AutomationOverview {
  settings: WorkAutomationSettings | null
  clients: AutomationClientOption[]
  projects: AutomationProjectOption[]
  /** Dzisiejsza data w strefie uzytkownika. */
  today: string
  /** `null`, gdy automat jest wylaczony. */
  nextRun: NextRun | null
  presence: PresenceState | null
  preview: AutomationPreviewDay[]
  recentRuns: RunRecord[]
}
