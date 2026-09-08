import type { ErrorReason, PresenceState, SkipReason, WeekdayKey, WeekSchedule } from './workAutomation.types'

/** Kolejnosc tygodnia w UI i w walidacji — poniedzialek pierwszy, jak w kalendarzu. */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  mon: 'Poniedziałek',
  tue: 'Wtorek',
  wed: 'Środa',
  thu: 'Czwartek',
  fri: 'Piątek',
  sat: 'Sobota',
  sun: 'Niedziela',
}

/**
 * Wartosci poczatkowe — wszystkie edytowalne. Niedziela startuje wylaczona,
 * ale z 8 godzinami, zeby wlaczenie jej nie wymagalo wpisywania liczby.
 */
export const DEFAULT_WEEK_SCHEDULE: WeekSchedule = {
  mon: { enabled: true, hours: 10 },
  tue: { enabled: true, hours: 10 },
  wed: { enabled: true, hours: 10 },
  thu: { enabled: true, hours: 10 },
  fri: { enabled: true, hours: 10 },
  sat: { enabled: true, hours: 8 },
  sun: { enabled: false, hours: 8 },
}

export const DEFAULT_RUN_TIME = '19:00'
export const DEFAULT_TIME_ZONE = 'Europe/Warsaw'

/** Strefy w selectcie. Kazda inna poprawna strefa IANA przejdzie walidacje. */
export const TIME_ZONE_OPTIONS = [
  'Europe/Warsaw',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Oslo',
  'Europe/London',
  'UTC',
] as const

/**
 * Sufit dni nadrabianych w jednym przebiegu. Reszta zaleglosci idzie do
 * kolejnych przebiegow — automat nie ma prawa jednym strzalem wypelnic
 * calej historii.
 */
export const MAX_CATCHUP_DAYS = 14

/** Sufit uzytkownikow obsluzonych w jednym przebiegu crona. */
export const MAX_AUTOMATION_USERS = 200

/** Ile dni pokazuje podglad w ustawieniach. */
export const PREVIEW_DAYS = 7

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  before_start: 'Przed datą uruchomienia automatu',
  home_stay: 'Pobyt w domu',
  weekday_off: 'Dzień tygodnia wyłączony w grafiku',
  entry_exists: 'Wpis na ten dzień już istnieje',
  automation_disabled: 'Automat był wtedy wyłączony',
  not_due_yet: 'Przed godziną zapisu',
  already_decided: 'Dzień już rozstrzygnięty',
  unknown_settings: 'Brak historii ustawień — rozstrzygnij ręcznie',
}

export const ERROR_REASON_LABELS: Record<ErrorReason, string> = {
  trips_unavailable: 'Nie udało się odczytać wyjazdów — automat wstrzymał zapis',
  entries_unavailable: 'Nie udało się odczytać wpisów — automat wstrzymał zapis',
  client_missing: 'Skonfigurowany klient jest niedostępny',
  client_not_hourly: 'Klient nie jest rozliczany godzinowo',
  project_mismatch: 'Projekt nie należy do wybranego klienta',
  insert_failed: 'Zapis wpisu nie powiódł się — automat spróbuje ponownie',
}

export const PRESENCE_LABELS: Record<PresenceState['because'], string> = {
  trip: 'Trwa wyjazd — automat zapisuje pracę według grafiku',
  resumption: 'Praca wznowiona ręcznie — automat zapisuje według grafiku',
  no_trips: 'Brak zaplanowanych zjazdów — automat zapisuje według grafiku',
  archived_trips_only: 'Tylko archiwalne wyjazdy — automat zapisuje według grafiku',
  between_trips: 'Pobyt w domu — automat wznowi zapis wraz z kolejnym wyjazdem',
  awaiting_first_trip: 'Pobyt w domu — czekamy na pierwszy zaplanowany wyjazd',
  after_return: 'Pobyt w domu — ustaw kolejny wyjazd lub wznów pracę',
}
