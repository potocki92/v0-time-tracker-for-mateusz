import {
  calculateEntryMoney,
  fallbackFromClient,
  resolveAppliedCurrency,
  resolveAppliedRate,
  resolveAppliedWorkType,
  type EntryCalculationFallback,
} from '@/lib/finance/entry-calculations'
import { convert, fromMajor, toMajor } from '@/lib/finance/money'
import { resolveQuantity } from '@/lib/finance/quantity'
import { isRealEntry } from '@/lib/finance/realization'
import type { WorkEntry } from '@/lib/types'
import {
  ALL,
  REPORT_BASE_CURRENCY,
  type ReportClientRef,
  type ReportEntryRow,
  type ReportFilters,
  type ReportProjectRef,
  type ReportRange,
  type ReportRecord,
} from './types'
import { isWithinRange } from './range'

/**
 * Status wpisu, ktory raport uznaje za wykonana prace. Urlop, L4 i dzien wolny
 * to nieobecnosci — nie maja godzin ani wartosci.
 */
export const PERFORMED_WORK_STATUS = 'worked' as const

/**
 * JEDYNA definicja „wykonanej pracy" w module.
 *
 * Plan (`entry_kind = 'predicted'`) nie jest wykonaniem. Automat zapisu pracy
 * tworzy wpis `real` takze dla dnia, dla ktorego istnieje juz reczny plan, wiec
 * liczenie obu naliczyloby ten sam dzien dwa razy. Wpisy historyczne bez
 * `entry_kind` sa `real` — tak samo jak w `isRealEntry`.
 *
 * Zapytanie serwerowe zaweza ten sam warunek w SQL (patrz
 * `services/reports.fetchers.server.ts`); tutaj jest jego zrodlo prawdy,
 * bo tylko ta funkcja decyduje o zawartosci raportu.
 */
export function isPerformedWork(
  entry: Pick<WorkEntry, 'status' | 'entry_kind'>,
): boolean {
  return entry.status === PERFORMED_WORK_STATUS && isRealEntry(entry)
}

const NO_BILLING_FALLBACK: EntryCalculationFallback = {
  rate: 0,
  currency: REPORT_BASE_CURRENCY,
  workType: 'hourly',
}

/**
 * Konfiguracja rozliczenia, ktora obowiazuje dla wpisu.
 *
 * Wpis niesie snapshot stawki z momentu zapisu (`billing_*`); starsze wiersze
 * maja tam `null` i musza cofnac sie do aktualnej konfiguracji klienta.
 * To ten fallback decydowal o bledzie „billable = billing_rate > 0".
 */
function fallbackFor(client: ReportClientRef | undefined): EntryCalculationFallback {
  return client ? fallbackFromClient(client) : NO_BILLING_FALLBACK
}

/**
 * Czy wpis jest rozliczany.
 *
 * Liczy sie stawka FAKTYCZNIE zastosowana, czyli snapshot z wpisu ALBO
 * stawka klienta. Sam `entry.billing_rate > 0` pomijal cala historie sprzed
 * wprowadzenia snapshotow i pokazywal 0% billable dla poprawnie
 * skonfigurowanych klientow.
 */
export function isBillable(
  entry: ReportEntryRow,
  client: ReportClientRef | undefined,
): boolean {
  return resolveAppliedRate(entry, fallbackFor(client)) > 0
}

/**
 * Wiersz z Supabase → rekord raportu: pieniadze policzone raz, etykiety
 * rozwiazane raz. Kwoty ida przez `lib/finance` (Money na bigincie), wiec
 * akord, waluty i stawki historyczne licza sie tak samo jak na fakturze.
 */
function toRecord(
  entry: ReportEntryRow,
  clients: Map<string, ReportClientRef>,
  projects: Map<string, ReportProjectRef>,
  eurRate: number,
): ReportRecord {
  const client = entry.client_id ? clients.get(entry.client_id) : undefined
  const project = entry.project_id ? projects.get(entry.project_id) : undefined
  const fallback = fallbackFor(client)

  const money = calculateEntryMoney(entry, fallback)
  const base = convert(money, REPORT_BASE_CURRENCY, eurRate)
  const workType = resolveAppliedWorkType(entry, fallback)

  return {
    id: entry.id,
    date: entry.date,
    clientId: entry.client_id,
    clientName: client?.name ?? null,
    projectId: entry.project_id,
    projectName: project?.name ?? null,
    hours: Number.isFinite(entry.hours) && entry.hours ? entry.hours : 0,
    quantity: workType === 'piecework' ? resolveQuantity(entry as WorkEntry) : 0,
    workType,
    appliedRateMinor: Number(
      fromMajor(resolveAppliedRate(entry, fallback), money.currency).amountMinor,
    ),
    appliedCurrency: resolveAppliedCurrency(entry, fallback),
    valueMinor: Number(money.amountMinor),
    valueBaseMinor: Number(base.amountMinor),
    billable: isBillable(entry, client),
    tags: entry.tags ?? [],
    source: entry.source ?? 'manual',
  }
}

/**
 * Cale pobrane okno jako rekordy wykonanej pracy, posortowane rosnaco po dacie.
 *
 * To jedyne miejsce, ktore odsiewa plan i nieobecnosci — kazda pozniejsza
 * agregacja (KPI, trend, breakdowny, insights, eksporty) dostaje juz gotowy,
 * odfiltrowany zbior.
 */
export function buildPerformedWorkRecords(
  entries: ReportEntryRow[],
  clients: ReportClientRef[],
  projects: ReportProjectRef[],
  eurRate: number,
): ReportRecord[] {
  const clientById = new Map(clients.map((c) => [c.id, c]))
  const projectById = new Map(projects.map((p) => [p.id, p]))

  return entries
    .filter(isPerformedWork)
    .map((entry) => toRecord(entry, clientById, projectById, eurRate))
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)))
}

/** Przekroj: klient, projekt, tag. Zakres dat jest osobno — patrz `selectRange`. */
export function applyDimensionFilters(
  records: ReportRecord[],
  filters: Pick<ReportFilters, 'clientId' | 'projectId' | 'tag'>,
): ReportRecord[] {
  return records.filter((record) => {
    if (filters.clientId !== ALL && record.clientId !== filters.clientId) return false
    if (filters.projectId !== ALL && record.projectId !== filters.projectId) return false
    if (filters.tag !== ALL && !record.tags.includes(filters.tag)) return false
    return true
  })
}

export function selectRange(records: ReportRecord[], range: ReportRange): ReportRecord[] {
  return records.filter((record) => isWithinRange(record.date, range))
}

/** Tagi obecne w zbiorze — zrodlo opcji filtra, posortowane alfabetycznie. */
export function collectTags(records: ReportRecord[]): string[] {
  return [...new Set(records.flatMap((record) => record.tags))].sort((a, b) => a.localeCompare(b))
}

/** Kwota w walucie raportu jako liczba jednostek glownych — dla eksportow. */
export function toMajorUnits(amountMinor: number): number {
  return toMajor({ amountMinor: BigInt(Math.round(amountMinor)), currency: REPORT_BASE_CURRENCY })
}
