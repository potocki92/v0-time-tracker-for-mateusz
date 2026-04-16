import type {
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

export const SORT_OPTIONS: { value: ClientsSortKey; label: string }[] = [
  { value: 'name',        label: 'Nazwa (A-Z)' },
  { value: 'rate',        label: 'Stawka' },
  { value: 'earnings',    label: 'Zarobki' },
  { value: 'hours',       label: 'Godziny' },
  { value: 'created_at',  label: 'Data dodania' },
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
