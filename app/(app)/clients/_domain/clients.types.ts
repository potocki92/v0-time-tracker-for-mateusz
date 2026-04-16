import type { Client, ClientRate, WorkEntry } from '@/lib/types'

export type ClientsSortKey =
  | 'name'
  | 'rate'
  | 'created_at'
  | 'earnings'
  | 'hours'

export type ClientsSortDirection = 'asc' | 'desc'

export type ClientsWorkTypeFilter = 'all' | 'hourly' | 'piecework'

export type ClientsCurrencyFilter = 'all' | 'PLN' | 'EUR'

export type ClientsData = {
  clients: Client[]
  workEntries: WorkEntry[]
}

/**
 * Klient wzbogacony o statystyki wyliczone po stronie klienta (selector).
 * `rateHistoryCount` = ile razy stawka była zmieniana (z client_rates jeśli dostępne,
 * inaczej 1 dla aktualnej stawki).
 */
export type ClientWithStats = Client & {
  totalEarningsInClientCurrency: number
  totalHours: number
  totalDays: number
  workEntriesCount: number
  lastEntryDate: string | null
  rateHistoryCount: number
}

export type ClientRateWithPeriod = ClientRate & {
  /** Data do której stawka obowiązywała — null = aktualnie obowiązująca */
  effective_to: string | null
}
