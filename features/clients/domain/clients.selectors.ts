import type { Client, WorkEntry } from '@/lib/types'
import { calculateEarnings } from '@/lib/finance/earnings'
import { ACTIVE_THRESHOLD_DAYS } from './clients.constants'
import type {
  ClientActivity,
  ClientPeriodStats,
  ClientRateWithPeriod,
  ClientWithStats,
  ClientsActivityFilter,
  ClientsCurrencyFilter,
  ClientsSortDirection,
  ClientsSortKey,
  ClientsWorkTypeFilter,
} from './clients.types'

const DAY_MS = 24 * 60 * 60 * 1000

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
 * Aktywność klienta na podstawie daty ostatniego wpisu.
 * Brak wpisów = klient dopiero dodany, jeszcze nic dla niego nie robiliśmy.
 */
export function deriveActivity(
  client: Pick<ClientWithStats, 'lastEntryDate' | 'workEntriesCount'>,
  now: number = Date.now(),
): ClientActivity {
  if (!client.lastEntryDate || client.workEntriesCount === 0) return 'new'
  const days = Math.floor((now - new Date(client.lastEntryDate).getTime()) / DAY_MS)
  return days <= ACTIVE_THRESHOLD_DAYS ? 'active' : 'dormant'
}

/** „dziś" / „wczoraj" / „5 dni temu" — czyta się szybciej niż pełna data. */
export function formatRelativeDate(iso: string | null, now: number = Date.now()): string | null {
  if (!iso) return null
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS)
  if (days <= 0) return 'dziś'
  if (days === 1) return 'wczoraj'
  if (days < 30) return `${days} dni temu`
  if (days < 365) return `${Math.floor(days / 30)} mies. temu`
  return `${Math.floor(days / 365)} lat temu`
}

/**
 * Aktualny zleceniodawca = klient z najświeższym wpisem pracy.
 *
 * Aplikacja nie ma stopera ani „wpisu w toku" — wpisy są dzienne, więc nie ma
 * czego odczytać na żywo. Najświeższy wpis to najbliższy dostępny odpowiednik
 * pytania „dla kogo teraz pracuję".
 *
 * Remisy (kilka wpisów tego samego dnia) rozstrzygamy liczbą wpisów, a potem
 * nazwą — inaczej karta hero migotałaby między klientami przy każdym renderze.
 */
export function selectCurrentClient(clients: ClientWithStats[]): ClientWithStats | null {
  let current: ClientWithStats | null = null

  for (const client of clients) {
    if (!client.lastEntryDate) continue
    if (!current) {
      current = client
      continue
    }

    const byDate = client.lastEntryDate.localeCompare(current.lastEntryDate!)
    if (byDate > 0) {
      current = client
    } else if (byDate === 0) {
      const byCount = client.workEntriesCount - current.workEntriesCount
      if (byCount > 0 || (byCount === 0 && client.name.localeCompare(current.name, 'pl') < 0)) {
        current = client
      }
    }
  }

  return current
}

/**
 * Godziny / zarobek / dni robocze klienta w miesiącu kalendarzowym `now`.
 * Bez konwersji walut — wynik jest w walucie klienta, tak jak w
 * `selectClientsWithStats`.
 */
export function selectClientMonthStats(
  client: Client,
  workEntries: WorkEntry[],
  now: Date = new Date(),
): ClientPeriodStats {
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let hours = 0
  let earnings = 0
  let days = 0

  for (const entry of workEntries) {
    if (entry.client_id !== client.id) continue
    if (entry.status !== 'worked') continue
    if (!entry.date.startsWith(prefix)) continue

    hours += entry.hours ?? 0
    earnings += calculateEarnings(entry, client, 1).amount
    days += 1
  }

  return { hours, earnings, days }
}

function formatClientAddress(c: Client): string | null {
  const line2 = [c.postal_code, c.city].filter(Boolean).join(' ').trim()
  const full = [c.address?.trim(), line2].filter(Boolean).join(', ')
  return full.length > 0 ? full : null
}

export function toExternalUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

/** Linki szybkich akcji kafelka — współdzielone przez kartę hero i listę. */
export function buildContactLinks(client: Client): {
  phoneHref: string | null
  mailHref: string | null
  mapsHref: string | null
  address: string | null
} {
  const address = formatClientAddress(client)
  return {
    phoneHref: client.phone ? `tel:${client.phone.replace(/\s+/g, '')}` : null,
    mailHref: client.email ? `mailto:${client.email}` : null,
    mapsHref: address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null,
    address,
  }
}

export function filterClientsByActivity<T extends ClientWithStats>(
  clients: T[],
  activity: ClientsActivityFilter,
  now: number = Date.now(),
): T[] {
  if (activity === 'all') return clients
  return clients.filter((c) => deriveActivity(c, now) === activity)
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
    const haystack = [c.name, c.nip, c.email, c.city, c.phone]
    return haystack.some((v) => normalizeSearchValue(v ?? '').includes(q))
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
      // Klienci bez wpisów lądują na końcu niezależnie od kierunku — „nigdy"
      // nie jest ani najstarszą, ani najnowszą datą, tylko brakiem odpowiedzi.
      case 'recent': {
        if (!a.lastEntryDate && !b.lastEntryDate) return a.name.localeCompare(b.name, 'pl')
        if (!a.lastEntryDate) return 1
        if (!b.lastEntryDate) return -1
        return a.lastEntryDate.localeCompare(b.lastEntryDate) * mul
      }
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
