import type { Client, ClientRate, WorkEntry } from '@/lib/types'

export type ClientsSortKey =
  | 'recent'
  | 'name'
  | 'rate'
  | 'created_at'
  | 'earnings'
  | 'hours'

export type ClientsSortDirection = 'asc' | 'desc'

export type ClientsWorkTypeFilter = 'all' | 'hourly' | 'piecework'

export type ClientsCurrencyFilter = 'all' | 'PLN' | 'EUR'

/**
 * Aktywność klienta wyliczana z daty ostatniego wpisu — patrz `deriveActivity`.
 * `new` = klient bez ani jednego wpisu pracy.
 */
export type ClientActivity = 'active' | 'dormant' | 'new'

export type ClientsActivityFilter = 'all' | ClientActivity

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

/** Godziny i zarobek klienta w obrębie jednego miesiąca — w walucie klienta. */
export type ClientPeriodStats = {
  hours: number
  earnings: number
  days: number
}

export type ClientRateWithPeriod = ClientRate & {
  /** Data do której stawka obowiązywała — null = aktualnie obowiązująca */
  effective_to: string | null
}
