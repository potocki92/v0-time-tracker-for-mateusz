import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

import { addDaysIso } from '@/features/trips/domain'
import { parseClockMinutes, zonedInstant, zonedParts } from '@/lib/date/timezone'

import {
  decideDay,
  isDue,
  MAX_CATCHUP_DAYS,
  type AutomationClientOption,
  type AutomationProjectOption,
  type ErrorReason,
  type RunDecisionRecord,
  type RunOutcome,
} from '../domain'
import {
  fetchClient,
  fetchEnabledUserIds,
  fetchEntriesByDate,
  fetchProject,
  fetchResumptions,
  fetchRunRecords,
  fetchSettings,
  fetchSettingVersions,
  fetchTrips,
  insertAutomationEntry,
  upsertRunRecord,
  type SettingVersion,
} from './workAutomation.repository.server'

/**
 * Wykonanie zadania: od konfiguracji do wpisu.
 *
 * Zadanie chodzi cyklicznie i samo wybiera daty, dla ktorych termin zostal
 * osiagniety, a decyzji jeszcze nie ma — nie musi trafic w konkretna minute.
 * Zapis nigdy nie nastepuje przed ustawiona godzina.
 */

/** Wszystkie daty z zakresu, wlacznie z granicami. */
function datesBetween(fromDate: string, toDate: string): string[] {
  const dates: string[] = []
  for (let date = fromDate; date <= toDate; date = addDaysIso(date, 1)) dates.push(date)
  return dates
}

/**
 * Wersja konfiguracji obowiazujaca w danej chwili. `versions` przychodzi
 * posortowane malejaco po `effective_from`.
 */
function versionInForceAt(versions: SettingVersion[], instant: Date): SettingVersion | null {
  const at = instant.getTime()
  return versions.find((version) => new Date(version.effectiveFrom).getTime() <= at) ?? null
}

/**
 * Granica, wedlug ktorej wybieramy wersje regul dla daty `date`: koniec jej
 * lokalnej doby, ale nie pozniej niz teraz.
 *
 * Dzieki temu wlaczenie automatu dzisiaj po godzinie zapisu obejmuje jeszcze
 * dzisiejszy dzien (koniec doby jest w przyszlosci, wiec liczy sie stan
 * biezacy), a dni sprzed wlaczenia dostaja wersje, ktora naprawde wtedy
 * obowiazywala — albo zadnej, jesli automat jeszcze nie istnial.
 */
function ruleBoundaryFor(date: string, timeZone: string, now: Date): Date {
  const endOfDay = zonedInstant(addDaysIso(date, 1), 0, timeZone)
  return endOfDay.getTime() < now.getTime() ? endOfDay : now
}

function emptyOutcome(userId: string): RunOutcome {
  return { userId, created: 0, skipped: 0, failed: 0, decisions: [] }
}

export interface UserRunOptions {
  /** Kontrolowany czas — testy podaja wlasna chwile. */
  now?: Date
}

export async function runAutomationForUser(
  supabase: SupabaseClient,
  userId: string,
  { now = new Date() }: UserRunOptions = {},
): Promise<RunOutcome> {
  // Odczyt tuz przed praca, a nie stan z listy crona: automat wylaczony
  // w miedzyczasie nie ma prawa nic zapisac.
  const settings = await fetchSettings(supabase, userId)
  if (!settings?.enabled) return emptyOutcome(userId)

  const runMinutes = parseClockMinutes(settings.runTime)
  if (runMinutes === null) return emptyOutcome(userId)

  const local = zonedParts(now, settings.timeZone)
  const windowStart = maxIso(settings.startDate, addDaysIso(local.date, -(MAX_CATCHUP_DAYS - 1)))
  if (windowStart > local.date) return emptyOutcome(userId)

  const due = datesBetween(windowStart, local.date).filter((date) =>
    isDue(date, local.date, local.minutes, runMinutes),
  )
  if (due.length === 0) return emptyOutcome(userId)

  // Dzien z decyzja inna niz blad jest rozstrzygniety na zawsze — to on
  // sprawia, ze recznie usunietego wpisu automatycznego nikt nie odtwarza.
  const history = await fetchRunRecords(supabase, userId, windowStart, local.date)
  const settled = new Set(
    history.filter((record) => record.outcome !== 'error').map((record) => record.localDate),
  )
  const pending = due.filter((date) => !settled.has(date))
  if (pending.length === 0) return emptyOutcome(userId)

  const outcome = emptyOutcome(userId)

  let versions: SettingVersion[]
  let trips: Awaited<ReturnType<typeof fetchTrips>>
  let resumptions: string[]
  let entriesByDate: Awaited<ReturnType<typeof fetchEntriesByDate>>

  try {
    // Pusta lista wyjazdow i blad ich odczytu to dwie rozne rzeczy: awaria
    // zapytania NIE moze zostac odczytana jako „brak zjazdow, wiec pracuje".
    ;[versions, trips, resumptions, entriesByDate] = await Promise.all([
      fetchSettingVersions(supabase, userId),
      fetchTrips(supabase, userId),
      fetchResumptions(supabase, userId),
      fetchEntriesByDate(supabase, userId, pending[0], local.date),
    ])
  } catch (error) {
    // Prefiks komunikatu pochodzi z repozytorium — rozrozniamy, czy padl odczyt
    // wyjazdow, czy wpisow, bo to inna wskazowka przy diagnozie.
    const message = error instanceof Error ? error.message : ''
    const reason: ErrorReason = message.startsWith('fetchTrips')
      ? 'trips_unavailable'
      : 'entries_unavailable'

    await recordError(supabase, userId, outcome, pending[0], reason, error)
    return outcome
  }

  const clientCache = new Map<string, AutomationClientOption | null>()
  const projectCache = new Map<string, AutomationProjectOption | null>()

  for (const date of pending) {
    const version = versionInForceAt(versions, ruleBoundaryFor(date, settings.timeZone, now))

    // Nie stosujemy dzisiejszych ustawien wstecz do dni, dla ktorych nie znamy
    // poprzednich — taki brak trafia do uzytkownika, nie do zgadywania.
    if (!version) {
      await record(supabase, userId, outcome, {
        localDate: date,
        outcome: 'skipped',
        reason: 'unknown_settings',
        hours: null,
        entryId: null,
        configVersionId: null,
      })
      continue
    }

    if (!version.enabled) {
      await record(supabase, userId, outcome, {
        localDate: date,
        outcome: 'skipped',
        reason: 'automation_disabled',
        hours: null,
        entryId: null,
        configVersionId: version.id,
      })
      continue
    }

    const decision = decideDay({
      date,
      weekSchedule: version.weekSchedule,
      activationDate: version.startDate,
      trips,
      resumptions,
      existingEntries: entriesByDate.get(date) ?? [],
    })

    if (decision.action === 'skip') {
      await record(supabase, userId, outcome, {
        localDate: date,
        outcome: 'skipped',
        reason: decision.reason,
        hours: null,
        entryId: null,
        configVersionId: version.id,
      })
      continue
    }

    const target = await resolveTarget(supabase, userId, version, clientCache, projectCache)
    if ('reason' in target) {
      await record(supabase, userId, outcome, {
        localDate: date,
        outcome: 'error',
        reason: target.reason,
        hours: null,
        entryId: null,
        configVersionId: version.id,
      })
      continue
    }

    try {
      const inserted = await insertAutomationEntry(supabase, {
        userId,
        date,
        hours: decision.hours,
        clientId: target.clientId,
        projectId: target.projectId,
      })

      // Konflikt z istniejacym wpisem to pominiecie, nie nadpisanie — wpis
      // mogl powstac recznie albo w rownoleglym przebiegu.
      await record(
        supabase,
        userId,
        outcome,
        'conflict' in inserted
          ? {
              localDate: date,
              outcome: 'skipped',
              reason: 'entry_exists',
              hours: null,
              entryId: null,
              configVersionId: version.id,
            }
          : {
              localDate: date,
              outcome: 'created',
              reason: 'created',
              hours: decision.hours,
              entryId: inserted.entryId,
              configVersionId: version.id,
            },
      )
    } catch (error) {
      await recordError(supabase, userId, outcome, date, 'insert_failed', error, version.id)
    }
  }

  return outcome
}

interface ResolvedTarget {
  clientId: string
  projectId: string | null
}

/**
 * Klient i projekt z wersji konfiguracji. Utrata dostepu daje blad, nigdy
 * podmiane na innego klienta.
 */
async function resolveTarget(
  supabase: SupabaseClient,
  userId: string,
  version: SettingVersion,
  clientCache: Map<string, AutomationClientOption | null>,
  projectCache: Map<string, AutomationProjectOption | null>,
): Promise<ResolvedTarget | { reason: ErrorReason }> {
  if (!version.clientId) return { reason: 'client_missing' }

  if (!clientCache.has(version.clientId)) {
    clientCache.set(version.clientId, await fetchClient(supabase, userId, version.clientId))
  }
  const client = clientCache.get(version.clientId) ?? null
  if (!client) return { reason: 'client_missing' }
  // Akord wymagalby ilosci, ktorej automat nie ma skad wziac — nie zgadujemy.
  if (client.workType !== 'hourly') return { reason: 'client_not_hourly' }

  if (!version.projectId) return { clientId: client.id, projectId: null }

  if (!projectCache.has(version.projectId)) {
    projectCache.set(version.projectId, await fetchProject(supabase, userId, version.projectId))
  }
  const project = projectCache.get(version.projectId) ?? null
  if (!project || project.clientId !== client.id) return { reason: 'project_mismatch' }

  return { clientId: client.id, projectId: project.id }
}

async function record(
  supabase: SupabaseClient,
  userId: string,
  outcome: RunOutcome,
  decision: RunDecisionRecord,
): Promise<void> {
  await upsertRunRecord(supabase, userId, decision)
  outcome.decisions.push(decision)
  if (decision.outcome === 'created') outcome.created += 1
  else if (decision.outcome === 'skipped') outcome.skipped += 1
  else outcome.failed += 1
}

async function recordError(
  supabase: SupabaseClient,
  userId: string,
  outcome: RunOutcome,
  localDate: string,
  reason: ErrorReason,
  error: unknown,
  configVersionId: string | null = null,
): Promise<void> {
  console.error('[work-automation]', userId, localDate, reason, error)
  await record(supabase, userId, outcome, {
    localDate,
    outcome: 'error',
    reason,
    hours: null,
    entryId: null,
    configVersionId,
  })
}

function maxIso(a: string, b: string): string {
  return a > b ? a : b
}

export interface AutomationRunSummary {
  processed: number
  created: number
  skipped: number
  failed: number
  errors: string[]
}

/**
 * Przebieg dla wszystkich wlaczonych uzytkownikow. Blad jednego nie zatrzymuje
 * pozostalych.
 */
export async function runWorkAutomation(
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<AutomationRunSummary> {
  const userIds = await fetchEnabledUserIds(supabase)
  const summary: AutomationRunSummary = {
    processed: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  for (const userId of userIds) {
    try {
      const outcome = await runAutomationForUser(supabase, userId, { now })
      summary.processed += 1
      summary.created += outcome.created
      summary.skipped += outcome.skipped
      summary.failed += outcome.failed
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[work-automation] przebieg uzytkownika przerwany', userId, message)
      summary.failed += 1
      summary.errors.push(`${userId}: ${message}`)
    }
  }

  return summary
}
