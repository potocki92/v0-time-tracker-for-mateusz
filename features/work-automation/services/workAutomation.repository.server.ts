import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  AutomationClientOption,
  AutomationDisabledReason,
  AutomationProjectOption,
  DateRange,
  ExistingEntry,
  RunDecisionRecord,
  RunRecord,
  WeekSchedule,
  WorkAutomationSettings,
} from '../domain'
import { MAX_AUTOMATION_USERS } from '../domain'

/**
 * Caly dostep do bazy dla automatu — jedno miejsce, ktore zna nazwy tabel
 * i kolumn. Klient przychodzi z zewnatrz, bo te same zapytania obsluguja dwa
 * konteksty: sesje uzytkownika (Server Actions, RLS) i klucz service-role
 * (cron, bez sesji). Dlatego KAZDE zapytanie filtruje po `user_id` jawnie —
 * bez sesji `auth.uid()` jest puste i baza sama niczego nie zawezi.
 */

const SETTINGS_TABLE = 'work_automation_settings'
const VERSIONS_TABLE = 'work_automation_setting_versions'
const RESUMPTIONS_TABLE = 'work_automation_resumptions'
const RUNS_TABLE = 'work_automation_runs'

const SETTINGS_COLUMNS =
  'enabled, start_date, run_time, time_zone, week_schedule, client_id, project_id, disabled_reason'

const VERSION_COLUMNS =
  'id, effective_from, enabled, start_date, run_time, time_zone, week_schedule, client_id, project_id'

/** Sufity odczytow — bez nich zapytania rosna liniowo z historia. */
const MAX_TRIPS = 500
const MAX_VERSIONS = 200
const MAX_RESUMPTIONS = 200
const MAX_RANGE_ENTRIES = 200
const MAX_RUN_RECORDS = 200

interface SettingsRow {
  enabled: boolean
  start_date: string
  run_time: string
  time_zone: string
  week_schedule: WeekSchedule
  client_id: string | null
  project_id: string | null
  disabled_reason: AutomationDisabledReason | null
}

export interface SettingVersion {
  id: string
  effectiveFrom: string
  enabled: boolean
  startDate: string
  runTime: string
  timeZone: string
  weekSchedule: WeekSchedule
  clientId: string | null
  projectId: string | null
}

function toSettings(row: SettingsRow): WorkAutomationSettings {
  return {
    enabled: row.enabled,
    startDate: row.start_date,
    runTime: row.run_time,
    timeZone: row.time_zone,
    weekSchedule: row.week_schedule,
    clientId: row.client_id ?? '',
    projectId: row.project_id ?? '',
    disabledReason: row.disabled_reason,
  }
}

export async function fetchSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkAutomationSettings | null> {
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select(SETTINGS_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`fetchSettings: ${error.message}`)
  return data ? toSettings(data as unknown as SettingsRow) : null
}

export interface SettingsWrite {
  enabled: boolean
  startDate: string
  runTime: string
  timeZone: string
  weekSchedule: WeekSchedule
  clientId: string | null
  projectId: string | null
}

export async function saveSettings(
  supabase: SupabaseClient,
  userId: string,
  values: SettingsWrite,
): Promise<void> {
  const { error } = await supabase.from(SETTINGS_TABLE).upsert(
    {
      user_id: userId,
      enabled: values.enabled,
      start_date: values.startDate,
      run_time: values.runTime,
      time_zone: values.timeZone,
      week_schedule: values.weekSchedule,
      client_id: values.clientId,
      project_id: values.projectId,
      // Zapis konfiguracji jest swiadoma decyzja uzytkownika — kasuje powod
      // wylaczenia ustawiony wczesniej przez system.
      disabled_reason: null,
    },
    { onConflict: 'user_id' },
  )

  if (error) throw new Error(`saveSettings: ${error.message}`)
}

/** Wiersze, ktore cron ma rozpatrzyc w tym przebiegu. */
export async function fetchEnabledUserIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('user_id')
    .eq('enabled', true)
    .limit(MAX_AUTOMATION_USERS)

  if (error) throw new Error(`fetchEnabledUserIds: ${error.message}`)
  return ((data ?? []) as { user_id: string }[]).map((row) => row.user_id)
}

/**
 * Historia konfiguracji, od najnowszej. Nadrabianie zaleglosci wybiera z niej
 * wersje obowiazujaca w danej chwili — dzisiejsze ustawienia nie moga zadzialac
 * wstecz.
 */
export async function fetchSettingVersions(
  supabase: SupabaseClient,
  userId: string,
): Promise<SettingVersion[]> {
  const { data, error } = await supabase
    .from(VERSIONS_TABLE)
    .select(VERSION_COLUMNS)
    .eq('user_id', userId)
    .order('effective_from', { ascending: false })
    .limit(MAX_VERSIONS)

  if (error) throw new Error(`fetchSettingVersions: ${error.message}`)

  return ((data ?? []) as unknown as Array<
    SettingsRow & { id: string; effective_from: string }
  >).map((row) => ({
    id: row.id,
    effectiveFrom: row.effective_from,
    enabled: row.enabled,
    startDate: row.start_date,
    runTime: row.run_time,
    timeZone: row.time_zone,
    weekSchedule: row.week_schedule,
    clientId: row.client_id,
    projectId: row.project_id,
  }))
}

export async function fetchResumptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from(RESUMPTIONS_TABLE)
    .select('resume_date')
    .eq('user_id', userId)
    .order('resume_date', { ascending: true })
    .limit(MAX_RESUMPTIONS)

  if (error) throw new Error(`fetchResumptions: ${error.message}`)
  return ((data ?? []) as { resume_date: string }[]).map((row) => row.resume_date)
}

export async function insertResumption(
  supabase: SupabaseClient,
  userId: string,
  resumeDate: string,
): Promise<void> {
  const { error } = await supabase
    .from(RESUMPTIONS_TABLE)
    .upsert({ user_id: userId, resume_date: resumeDate }, { onConflict: 'user_id,resume_date' })

  if (error) throw new Error(`insertResumption: ${error.message}`)
}

/**
 * Wyjazdy uzytkownika. Pusta lista i blad odczytu to DWIE rozne sytuacje —
 * blad leci wyjatkiem, zeby automat nie uznal go za „brak zjazdow, wiec pracuje".
 */
export async function fetchTrips(
  supabase: SupabaseClient,
  userId: string,
): Promise<DateRange[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('start_date, end_date')
    .eq('user_id', userId)
    .order('start_date', { ascending: true })
    .limit(MAX_TRIPS)

  if (error) throw new Error(`fetchTrips: ${error.message}`)

  return ((data ?? []) as { start_date: string; end_date: string }[]).map((row) => ({
    startDate: row.start_date,
    endDate: row.end_date,
  }))
}

/** Wpisy z zakresu, zgrupowane po dacie — decyduje tylko rodzaj wpisu. */
export async function fetchEntriesByDate(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<Map<string, ExistingEntry[]>> {
  const { data, error } = await supabase
    .from('work_entries')
    .select('date, entry_kind')
    .eq('user_id', userId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .limit(MAX_RANGE_ENTRIES)

  if (error) throw new Error(`fetchEntriesByDate: ${error.message}`)

  const byDate = new Map<string, ExistingEntry[]>()
  for (const row of (data ?? []) as { date: string; entry_kind: string | null }[]) {
    const bucket = byDate.get(row.date) ?? []
    bucket.push({ entryKind: row.entry_kind === 'predicted' ? 'predicted' : 'real' })
    byDate.set(row.date, bucket)
  }

  return byDate
}

export async function fetchClient(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
): Promise<AutomationClientOption | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, work_type')
    .eq('user_id', userId)
    .eq('id', clientId)
    .maybeSingle()

  if (error) throw new Error(`fetchClient: ${error.message}`)
  if (!data) return null

  const row = data as { id: string; name: string; work_type: string }
  return {
    id: row.id,
    name: row.name,
    workType: row.work_type === 'piecework' ? 'piecework' : 'hourly',
  }
}

export async function fetchProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<AutomationProjectOption | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, client_id')
    .eq('user_id', userId)
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw new Error(`fetchProject: ${error.message}`)
  if (!data) return null

  const row = data as { id: string; name: string; client_id: string }
  return { id: row.id, name: row.name, clientId: row.client_id }
}

export async function fetchRunRecords(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<RunRecord[]> {
  const { data, error } = await supabase
    .from(RUNS_TABLE)
    .select('local_date, outcome, reason, hours, entry_id, config_version_id, decided_at')
    .eq('user_id', userId)
    .gte('local_date', fromDate)
    .lte('local_date', toDate)
    .order('local_date', { ascending: false })
    .limit(MAX_RUN_RECORDS)

  if (error) throw new Error(`fetchRunRecords: ${error.message}`)
  return ((data ?? []) as unknown as RunRow[]).map(toRunRecord)
}

interface RunRow {
  local_date: string
  outcome: 'created' | 'skipped' | 'error'
  reason: string
  hours: number | null
  entry_id: string | null
  config_version_id: string | null
  decided_at: string
}

function toRunRecord(row: RunRow): RunRecord {
  return {
    localDate: row.local_date,
    outcome: row.outcome,
    reason: row.reason as RunDecisionRecord['reason'],
    hours: row.hours === null ? null : Number(row.hours),
    entryId: row.entry_id,
    configVersionId: row.config_version_id,
    decidedAt: row.decided_at,
  }
}

/** Kod bledu Postgresa dla naruszenia unikalnosci. */
const UNIQUE_VIOLATION = '23505'

export interface AutomationEntryInput {
  userId: string
  date: string
  hours: number
  clientId: string
  projectId: string | null
}

/**
 * Wstawia wpis rzeczywisty. Nie sprawdzamy najpierw istnienia wpisu, bo miedzy
 * sprawdzeniem a insertem zmiescilby sie drugi przebieg — o jednosci decyduje
 * UNIQUE (user_id, date, entry_kind) w bazie. Konflikt oznacza pominiecie,
 * nigdy nadpisanie cudzego wpisu.
 *
 * `billing_rate` / `billing_currency` uzupelnia trigger snapshotu stawek, wiec
 * automat nie kopiuje regul stawek do siebie.
 */
export async function insertAutomationEntry(
  supabase: SupabaseClient,
  input: AutomationEntryInput,
): Promise<{ entryId: string } | { conflict: true }> {
  const { data, error } = await supabase
    .from('work_entries')
    .insert({
      user_id: input.userId,
      date: input.date,
      status: 'worked',
      entry_kind: 'real',
      source: 'automation',
      hours: input.hours,
      client_id: input.clientId,
      project_id: input.projectId,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { conflict: true }
    throw new Error(`insertAutomationEntry: ${error.message}`)
  }

  return { entryId: (data as { id: string }).id }
}

/**
 * Jeden wiersz na (uzytkownik, data lokalna) — `PRIMARY KEY (user_id, local_date)`.
 *
 * Zapis jest CELOWO dwuetapowy, a nie jednym `upsert`: raz podjeta decyzja inna
 * niz blad jest ostateczna i nie wolno jej nadpisac. Bezwarunkowe
 * `ON CONFLICT DO UPDATE` pozwalalo dwom rownoleglym przebiegom zepsuc dziennik
 * — zwyciezca zapisywal `created`, a przegrany (ten z konfliktem na
 * `work_entries`) nadpisywal go `skipped / entry_exists`, gubiac `entry_id`
 * i liczbe godzin. Przy schedulerze chodzacym co minute to realny scenariusz.
 *
 * Stad: najpierw INSERT, a przy konflikcie UPDATE zawezony do wiersza z bledem.
 * Oba zdania sa atomowe, wiec jedyne dozwolone przejscie to `error` →
 * cokolwiek (blad jest ponawialny), a wynik rownoleglego przebiegu zostaje
 * nietkniety.
 */
export async function upsertRunRecord(
  supabase: SupabaseClient,
  userId: string,
  record: RunDecisionRecord,
): Promise<void> {
  const row = {
    user_id: userId,
    local_date: record.localDate,
    outcome: record.outcome,
    reason: record.reason,
    hours: record.hours,
    entry_id: record.entryId,
    config_version_id: record.configVersionId,
    decided_at: new Date().toISOString(),
  }

  const { error: insertError } = await supabase.from(RUNS_TABLE).insert(row)
  if (!insertError) return
  if (insertError.code !== UNIQUE_VIOLATION) {
    throw new Error(`upsertRunRecord: ${insertError.message}`)
  }

  const { error: updateError } = await supabase
    .from(RUNS_TABLE)
    .update(row)
    .eq('user_id', userId)
    .eq('local_date', record.localDate)
    .eq('outcome', 'error')

  if (updateError) throw new Error(`upsertRunRecord: ${updateError.message}`)
}
