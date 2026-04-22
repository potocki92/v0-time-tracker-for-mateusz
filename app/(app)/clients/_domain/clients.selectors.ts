import type { Client, WorkEntry } from '@/lib/types'
import { calculateEarnings } from '@/lib/finance/earnings'
import type {
  ClientRateWithPeriod,
  ClientWithStats,
  ClientsCurrencyFilter,
  ClientsSortDirection,
  ClientsSortKey,
  ClientsWorkTypeFilter,
} from './clients.types'

/**
 * Agreguje WorkEntries per klient — godziny, dni, zarobki w walucie klienta.
 * Brak konwersji walut — tu nie potrzebujemy mieszać PLN/EUR (operujemy per klient).
 */
export function selectClientsWithStats(
  clients: Client[],
  workEntries: WorkEntry[],
  rateHistoryByClient: Record<string, number>,
): ClientWithStats[] {
  const byClient = new Map<string, WorkEntry[]>()
  for (const entry of workEntries) {
    if (!entry.client_id) continue
    const bucket = byClient.get(entry.client_id)
    if (bucket) bucket.push(entry)
    else byClient.set(entry.client_id, [entry])
  }

  return clients.map((client) => {
    const entries = byClient.get(client.id) ?? []
    const worked  = entries.filter((e) => e.status === 'worked')

    let totalEarnings = 0
    let totalHours    = 0
    let lastEntryDate: string | null = null

    for (const entry of worked) {
      const e = calculateEarnings(entry, client, 1) // eurRate nieistotny — liczymy w walucie klienta
      totalEarnings += e.amount
      totalHours    += entry.hours ?? 0
      if (!lastEntryDate || entry.date > lastEntryDate) lastEntryDate = entry.date
    }

    return {
      ...client,
      totalEarningsInClientCurrency: totalEarnings,
      totalHours,
      totalDays:         worked.length,
      workEntriesCount:  entries.length,
      lastEntryDate,
      rateHistoryCount:  rateHistoryByClient[client.id] ?? 1,
    }
  })
}

/**
 * Wyszukiwanie po nazwie / NIP / email — case-insensitive.
 * Dodatkowo normalizujemy diakrytyki i wielokrotne spacje.
 * Pusty query → wszyscy klienci.
 */
function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function filterClientsBySearch<T extends Client>(
  clients: T[],
  query: string,
): T[] {
  const q = normalizeSearchValue(query)
  if (!q) return clients

  return clients.filter((c) => {
    const name = normalizeSearchValue(c.name)
    const nip = normalizeSearchValue(c.nip ?? '')
    const email = normalizeSearchValue(c.email ?? '')
    return name.includes(q) || nip.includes(q) || email.includes(q)
  })
}

export function filterClientsByWorkType<T extends Client>(
  clients: T[],
  workType: ClientsWorkTypeFilter,
): T[] {
  if (workType === 'all') return clients
  return clients.filter((c) => c.work_type === workType)
}

export function filterClientsByCurrency<T extends Client>(
  clients: T[],
  currency: ClientsCurrencyFilter,
): T[] {
  if (currency === 'all') return clients
  return clients.filter((c) => c.currency === currency)
}

export function sortClients(
  clients: ClientWithStats[],
  key: ClientsSortKey,
  direction: ClientsSortDirection,
): ClientWithStats[] {
  const mul = direction === 'asc' ? 1 : -1
  return [...clients].sort((a, b) => {
    switch (key) {
      case 'name':       return a.name.localeCompare(b.name, 'pl') * mul
      case 'rate':       return (a.rate - b.rate) * mul
      case 'earnings':   return (a.totalEarningsInClientCurrency - b.totalEarningsInClientCurrency) * mul
      case 'hours':      return (a.totalHours - b.totalHours) * mul
      case 'created_at': return a.created_at.localeCompare(b.created_at) * mul
      default:           return 0
    }
  })
}

/**
 * Zamienia listę stawek (posortowaną DESC po effective_from) na okresy z `effective_to`.
 * Najnowsza stawka ma `effective_to = null` (aktualnie obowiązująca).
 */
export function withEffectivePeriods(
  rates: Array<{ id: string; client_id: string; user_id: string; rate: number; currency: 'PLN' | 'EUR'; work_type: 'hourly' | 'piecework'; unit: string | null; effective_from: string; note: string | null; created_at: string }>,
): ClientRateWithPeriod[] {
  const sorted = [...rates].sort((a, b) => b.effective_from.localeCompare(a.effective_from))
  return sorted.map((rate, idx) => ({
    ...rate,
    effective_to: idx === 0 ? null : sorted[idx - 1].effective_from,
  }))
}
