import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

import { addDaysIso } from '@/features/trips/domain'
import { zonedParts } from '@/lib/date/timezone'

import {
  DEFAULT_TIME_ZONE,
  nextRunInstant,
  planDays,
  PREVIEW_DAYS,
  resolvePresence,
  weekdayKeyOf,
  type AutomationClientOption,
  type AutomationOverview,
  type AutomationPreviewDay,
  type AutomationProjectOption,
  type DayDecision,
  type NextRun,
  type WorkAutomationSettings,
} from '../domain'
import {
  fetchEntriesByDate,
  fetchResumptions,
  fetchRunRecords,
  fetchSettings,
  fetchTrips,
} from './workAutomation.repository.server'

/**
 * Dane sekcji „Automatyczne zapisywanie pracy".
 *
 * Podglad liczy sie TA SAMA czysta logika, ktorej uzywa zadanie serwerowe
 * (`planDays` → `decideDay`), i nie zapisuje niczego do bazy. Wynik podgladu
 * nie uprawnia do zapisu — o tym decyduje dopiero przebieg zadania.
 */

/** Ile dni wstecz pokazujemy w historii decyzji. */
const HISTORY_DAYS = 30
const HISTORY_LIMIT = 7
const MAX_SELECT_CLIENTS = 500
const MAX_SELECT_PROJECTS = 500

function toPreviewDay(decision: DayDecision): AutomationPreviewDay {
  return {
    date: decision.date,
    weekday: weekdayKeyOf(decision.date),
    hours: decision.action === 'create' ? decision.hours : null,
    reason: decision.action === 'skip' ? decision.reason : null,
  }
}

export async function loadAutomationOverview(
  supabase: SupabaseClient,
  userId: string,
  now: Date = new Date(),
): Promise<AutomationOverview> {
  const [settings, clients, projects] = await Promise.all([
    fetchSettings(supabase, userId),
    fetchClientOptions(supabase, userId),
    fetchProjectOptions(supabase, userId),
  ])

  if (!settings) {
    return {
      settings: null,
      clients,
      projects,
      today: zonedParts(now, DEFAULT_TIME_ZONE).date,
      nextRun: null,
      presence: null,
      preview: [],
      recentRuns: [],
    }
  }

  const today = zonedParts(now, settings.timeZone).date

  // Blad odczytu wyjazdow leci wyjatkiem do gory — podglad ma pokazac blad,
  // a nie plan zbudowany na zalozeniu „brak zjazdow".
  const [trips, resumptions, entriesByDate, history] = await Promise.all([
    fetchTrips(supabase, userId),
    fetchResumptions(supabase, userId),
    fetchEntriesByDate(supabase, userId, today, addDaysIso(today, PREVIEW_DAYS - 1)),
    fetchRunRecords(supabase, userId, addDaysIso(today, -HISTORY_DAYS), today),
  ])

  const preview = planDays({
    config: settings,
    trips,
    resumptions,
    entriesByDate,
    fromDate: today,
    days: PREVIEW_DAYS,
  }).map(toPreviewDay)

  return {
    settings,
    clients,
    projects,
    today,
    nextRun: settings.enabled ? resolveNextRun(settings, now) : null,
    presence: resolvePresence({
      date: today,
      trips,
      resumptions,
      activationDate: settings.startDate,
    }),
    preview,
    recentRuns: history.slice(0, HISTORY_LIMIT),
  }
}

/**
 * Godzine bierzemy z faktycznej chwili, nie z pola formularza: przy wiosennej
 * zmianie czasu ustawiona godzina moze nie istniec i zapis wypada po przeskoku.
 */
function resolveNextRun(
  settings: WorkAutomationSettings,
  now: Date,
): NextRun | null {
  const instant = nextRunInstant(settings, now)
  if (!instant) return null

  const parts = zonedParts(instant, settings.timeZone)
  const hours = String(Math.floor(parts.minutes / 60)).padStart(2, '0')
  const minutes = String(parts.minutes % 60).padStart(2, '0')

  return { date: parts.date, time: `${hours}:${minutes}` }
}

async function fetchClientOptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<AutomationClientOption[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, work_type')
    .eq('user_id', userId)
    .order('name', { ascending: true })
    .limit(MAX_SELECT_CLIENTS)

  if (error) throw new Error(`fetchClientOptions: ${error.message}`)

  return ((data ?? []) as { id: string; name: string; work_type: string }[]).map((row) => ({
    id: row.id,
    name: row.name,
    workType: row.work_type === 'piecework' ? 'piecework' : 'hourly',
  }))
}

async function fetchProjectOptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<AutomationProjectOption[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, client_id')
    .eq('user_id', userId)
    .order('name', { ascending: true })
    .limit(MAX_SELECT_PROJECTS)

  if (error) throw new Error(`fetchProjectOptions: ${error.message}`)

  return ((data ?? []) as { id: string; name: string; client_id: string }[]).map((row) => ({
    id: row.id,
    name: row.name,
    clientId: row.client_id,
  }))
}
