import type {
  ClientActivity,
  ClientsActivityFilter,
  ClientsCurrencyFilter,
  ClientsSortKey,
  ClientsWorkTypeFilter,
} from './clients.types'

export const CLIENT_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
] as const

export const WORK_TYPE_LABELS: Record<'hourly' | 'piecework', string> = {
  hourly:    'Godzinowa',
  piecework: 'Akordowa',
}

/**
 * Próg (w dniach) od ostatniego wpisu, poniżej którego klient liczy się jako aktywny.
 */
export const ACTIVE_THRESHOLD_DAYS = 30

export const ACTIVITY_LABELS: Record<ClientActivity, string> = {
  active:  'Aktywny',
  dormant: 'Uśpiony',
  new:     'Nowy',
}

/** Kropka statusu — używana na awatarze kafelka. */
export const ACTIVITY_DOT: Record<ClientActivity, string> = {
  active:  'bg-emerald-500',
  dormant: 'bg-amber-500',
  new:     'bg-sky-500',
}

/** Pigułka statusu — konwencja jak PROJECT_STATUS_PILL w module Projekty. */
export const ACTIVITY_PILL: Record<ClientActivity, string> = {
  active:  'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40',
  dormant: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  new:     'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
}

/** Nagłówki grup na liście — liczba mnoga, jak „W TRAKCIE 1" w Projektach. */
export const ACTIVITY_GROUP_LABELS: Record<ClientActivity, string> = {
  active:  'Aktywni',
  dormant: 'Uśpieni',
  new:     'Nowi',
}

/**
 * Kolejność grup na liście. Ta sama intencja co w `sortClients` dla klucza
 * 'recent': najpierw żywe relacje, na końcu klienci bez ani jednego wpisu.
 * Rozjazd między tymi dwoma porządkami czytałby się jak błąd sortowania.
 */
export const ACTIVITY_GROUP_ORDER: ClientActivity[] = ['active', 'dormant', 'new']

export const SORT_OPTIONS: { value: ClientsSortKey; label: string }[] = [
  { value: 'recent',      label: 'Ostatnia praca' },
  { value: 'name',        label: 'Nazwa (A-Z)' },
  { value: 'rate',        label: 'Stawka' },
  { value: 'earnings',    label: 'Zarobki' },
  { value: 'hours',       label: 'Godziny' },
  { value: 'created_at',  label: 'Data dodania' },
]

export const STATUS_FILTER_OPTIONS: { value: ClientsActivityFilter; label: string }[] = [
  { value: 'all',     label: 'Wszyscy' },
  { value: 'active',  label: 'Aktywni' },
  { value: 'dormant', label: 'Uśpieni' },
  { value: 'new',     label: 'Nowi' },
]

export const WORK_TYPE_FILTER_OPTIONS: { value: ClientsWorkTypeFilter; label: string }[] = [
  { value: 'all',       label: 'Wszystkie typy' },
  { value: 'hourly',    label: 'Godzinowa' },
  { value: 'piecework', label: 'Akordowa' },
]

export const CURRENCY_FILTER_OPTIONS: { value: ClientsCurrencyFilter; label: string }[] = [
  { value: 'all', label: 'Wszystkie waluty' },
  { value: 'PLN', label: 'PLN' },
  { value: 'EUR', label: 'EUR' },
]
