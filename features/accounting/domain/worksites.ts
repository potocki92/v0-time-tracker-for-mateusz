import { isPerformedWork } from './dataset'
import type {
  DateKey,
  StatementEntryRow,
  StatementProjectRef,
  StatementRange,
  StatementWorksite,
} from './types'

/**
 * Miejsca wykonywania pracy w okresie faktury — kolumna „gdzie".
 *
 * Faktura nie ma wlasnego adresu wykonania i nie powinna go miec: to samo
 * miejsce trafia na wiele faktur, a przeprowadzka ekipy nie moze przepisywac
 * historii. Zrodlem prawdy jest `projects.address` z wpisow pracy tego samego
 * klienta, ktore mieszcza sie w okresie uslugi.
 */

type Accumulator = {
  projectId: string | null
  projectName: string | null
  location: string | null
  from: DateKey
  to: DateKey
  dates: Set<DateKey>
  hours: number
}

/**
 * Indeks wpisow pracy po kliencie.
 *
 * Budowany RAZ dla calego wykazu: bez niego kazda faktura przechodzilaby po
 * wszystkich wpisach roku, czyli rok pracy razy rok faktur.
 */
export type EntriesByClient = ReadonlyMap<string, StatementEntryRow[]>

const NO_ENTRIES: StatementEntryRow[] = []

/** Klucz dla wpisow bez klienta — takie nie trafia do zadnej faktury. */
const UNASSIGNED = ''

export function indexEntriesByClient(entries: readonly StatementEntryRow[]): EntriesByClient {
  const index = new Map<string, StatementEntryRow[]>()

  for (const entry of entries) {
    if (!isPerformedWork(entry)) continue
    const key = entry.client_id ?? UNASSIGNED
    const bucket = index.get(key)
    if (bucket) bucket.push(entry)
    else index.set(key, [entry])
  }

  return index
}

/**
 * Miejsca pracy dla JEDNEJ faktury: jeden wiersz na projekt.
 *
 * `from`/`to` to skrajne dni Z PRACA w tym projekcie wewnatrz okresu faktury,
 * a nie granice samego okresu — wyjazd przerwany weekendem zostaje jednym
 * ciaglym pobytem, a `workedDays` mowi, ile dni realnie przepracowano.
 *
 * Projekt bez adresu i wpisy bez projektu NIE znikaja: dostaja `null`,
 * a etykiete zastepcza podstawia warstwa prezentacji, zeby godziny sie zgadzaly.
 */
export function buildWorksitesForInvoice(
  entriesByClient: EntriesByClient,
  projects: ReadonlyMap<string, StatementProjectRef>,
  clientId: string | null,
  period: StatementRange | null,
): StatementWorksite[] {
  if (!clientId || !period) return []

  const byProject = new Map<string, Accumulator>()

  for (const entry of entriesByClient.get(clientId) ?? NO_ENTRIES) {
    if (entry.date < period.start || entry.date > period.end) continue

    const key = entry.project_id ?? UNASSIGNED
    const project = entry.project_id ? projects.get(entry.project_id) : undefined
    const hours = entry.hours ?? 0
    const existing = byProject.get(key)

    if (!existing) {
      byProject.set(key, {
        projectId: entry.project_id,
        projectName: project?.name ?? null,
        location: project?.address ?? null,
        from: entry.date,
        to: entry.date,
        dates: new Set([entry.date]),
        hours,
      })
      continue
    }

    existing.dates.add(entry.date)
    existing.hours += hours
    if (entry.date < existing.from) existing.from = entry.date
    if (entry.date > existing.to) existing.to = entry.date
  }

  return [...byProject.values()]
    .map(({ dates, ...worksite }) => ({ ...worksite, workedDays: dates.size }))
    .sort((a, b) => a.from.localeCompare(b.from) || b.hours - a.hours)
}

/**
 * Dni z praca i godziny dla calego okresu faktury.
 *
 * Liczone z wpisow, a NIE z dodania kolumn `workedDays` — ten sam dzien
 * przepracowany w dwoch projektach jest jednym dniem pracy, wiec suma
 * kolumny bylaby zawyzona.
 */
export function summarizeWorkedPeriod(
  entriesByClient: EntriesByClient,
  clientId: string | null,
  period: StatementRange | null,
): { workedDays: number; hours: number } {
  if (!clientId || !period) return { workedDays: 0, hours: 0 }

  const dates = new Set<DateKey>()
  let hours = 0

  for (const entry of entriesByClient.get(clientId) ?? NO_ENTRIES) {
    if (entry.date < period.start || entry.date > period.end) continue
    dates.add(entry.date)
    hours += entry.hours ?? 0
  }

  return { workedDays: dates.size, hours }
}
