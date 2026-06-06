import type { Client, CURRENCY, Project, WorkEntry } from '@/lib/types'
import { getISOWeekNumber, getISOWeekYear, getWeekRange } from '@/lib/date/week'
import { getTodayLocalDateString } from '@/lib/helpers'
import { partitionByRealization } from '@/lib/finance/realization'
import {
  fallbackFromClient,
  resolveAppliedCurrency,
  resolveAppliedRate,
  resolveAppliedWorkType,
  sumEntriesByCurrency,
  type BillingWorkType,
  type EntryCalculationFallback,
} from '@/lib/finance/entry-calculations'
import type { Money } from '@/lib/finance/money'

const UNASSIGNED_KEY = '__unassigned__'
const UNASSIGNED_LABEL = 'Bez przypisania'

const UNASSIGNED_FALLBACK: EntryCalculationFallback = {
  rate: 0,
  currency: 'PLN',
  workType: 'hourly',
}

/** Stawka faktyczna zastosowana do wpisu (override z wpisu → fallback z klienta). */
export type AppliedRate = {
  rate: number
  currency: CURRENCY
  workType: BillingWorkType
  unit: string | null
}

/** Blok podsumowania dla jednego kontrahenta (lub „Bez przypisania"). */
export type ContractorBlock = {
  clientId: string | null
  clientName: string
  /** Pełne dane kontrahenta dla księgowej (NIP, adres…); null dla „Bez przypisania". */
  client: Client | null
  /** Pierwszy przepracowany dzień w tygodniu (klucz `YYYY-MM-DD`). */
  workedFrom: string
  /** Ostatni przepracowany dzień w tygodniu (klucz `YYYY-MM-DD`). */
  workedTo: string
  workedDaysCount: number
  totalHours: number
  /** Wyróżnione stawki do faktury (zwykle jedna). */
  rates: AppliedRate[]
  /** Adresy projektów (miejsca pracy) z przepracowanych wpisów; bez duplikatów. */
  workLocations: string[]
  totals: { PLN: Money; EUR: Money }
}

export type WeeklySummary = {
  /** Numer tygodnia ISO (KW). */
  weekNumber: number
  weekYear: number
  /** Czytelny zakres, np. „01.06 – 07.06.2026". */
  rangeLabel: string
  /** Klucze dat całego tygodnia (poniedziałek–niedziela). */
  from: string
  to: string
  contractors: ContractorBlock[]
  isEmpty: boolean
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatRangeLabel(start: Date, end: Date): string {
  const dm = (d: Date) =>
    d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
  return `${dm(start)} – ${dm(end)}.${end.getFullYear()}`
}

function dedupeRates(entries: WorkEntry[], fallback: EntryCalculationFallback): AppliedRate[] {
  const seen = new Map<string, AppliedRate>()
  for (const entry of entries) {
    const rate = resolveAppliedRate(entry, fallback)
    const currency = resolveAppliedCurrency(entry, fallback)
    const workType = resolveAppliedWorkType(entry, fallback)
    const unit = entry.billing_unit ?? null
    const key = `${rate}|${currency}|${workType}|${unit ?? ''}`
    if (!seen.has(key)) seen.set(key, { rate, currency, workType, unit })
  }
  return [...seen.values()]
}

/** Adresy projektów (miejsca pracy) z wpisów, bez duplikatów, w kolejności wystąpienia. */
function collectWorkLocations(
  entries: WorkEntry[],
  projectById: Map<string, Project>,
): string[] {
  const seen = new Set<string>()
  for (const entry of entries) {
    if (!entry.project_id) continue
    const address = projectById.get(entry.project_id)?.address?.trim()
    if (address) seen.add(address)
  }
  return [...seen]
}

function buildBlock(
  clientId: string | null,
  client: Client | null,
  entries: WorkEntry[],
  projectById: Map<string, Project>,
): ContractorBlock {
  const dates = entries.map((e) => e.date).sort()
  const fallback = client ? fallbackFromClient(client) : UNASSIGNED_FALLBACK

  return {
    clientId,
    clientName: client?.name ?? UNASSIGNED_LABEL,
    client,
    workedFrom: dates[0],
    workedTo: dates[dates.length - 1],
    workedDaysCount: new Set(dates).size,
    totalHours: entries.reduce((sum, e) => sum + (e.hours ?? 0), 0),
    rates: dedupeRates(entries, fallback),
    workLocations: collectWorkLocations(entries, projectById),
    totals: sumEntriesByCurrency(entries, fallback),
  }
}

/**
 * Buduje podsumowanie realnie przepracowanego tygodnia, pogrupowane per kontrahent.
 * Liczone są wyłącznie wpisy zrealizowane (`real`, data ≤ dziś) o statusie `worked`.
 *
 * @param weekStart dowolna data w obrębie tygodnia, dla którego budujemy raport
 */
export function buildWeeklySummary(
  workEntries: WorkEntry[],
  clients: Client[],
  weekStart: Date,
  today: string = getTodayLocalDateString(),
  projects: Project[] = [],
): WeeklySummary {
  const { start, end } = getWeekRange(weekStart)
  const from = toDateKey(start)
  const to = toDateKey(end)

  const { realized } = partitionByRealization(workEntries, today)
  const worked = realized.filter(
    (e) => e.status === 'worked' && e.date >= from && e.date <= to,
  )

  const clientById = new Map(clients.map((c) => [c.id, c]))
  const projectById = new Map(projects.map((p) => [p.id, p]))
  const grouped = new Map<string, WorkEntry[]>()
  for (const entry of worked) {
    const key = entry.client_id ?? UNASSIGNED_KEY
    const bucket = grouped.get(key)
    if (bucket) bucket.push(entry)
    else grouped.set(key, [entry])
  }

  const contractors = [...grouped.entries()]
    .map(([key, entries]) => {
      const client = key === UNASSIGNED_KEY ? null : clientById.get(key) ?? null
      const clientId = key === UNASSIGNED_KEY ? null : key
      return buildBlock(clientId, client, entries, projectById)
    })
    .sort((a, b) => {
      // „Bez przypisania" zawsze na końcu, reszta alfabetycznie.
      if (a.clientId === null) return 1
      if (b.clientId === null) return -1
      return a.clientName.localeCompare(b.clientName, 'pl')
    })

  return {
    weekNumber: getISOWeekNumber(start),
    weekYear: getISOWeekYear(start),
    rangeLabel: formatRangeLabel(start, end),
    from,
    to,
    contractors,
    isEmpty: contractors.length === 0,
  }
}
