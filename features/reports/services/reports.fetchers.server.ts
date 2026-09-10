import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { PERFORMED_WORK_STATUS } from '../domain/dataset'
import type {
  ReportClientRef,
  ReportEntryRow,
  ReportProjectRef,
  ReportRange,
} from '../domain/types'
import {
  REPORTS_CLIENT_COLUMNS,
  REPORTS_FALLBACK_EUR_RATE,
  REPORTS_MAX_CLIENTS,
  REPORTS_MAX_PROJECTS,
  REPORTS_MAX_WORK_ENTRIES,
  REPORTS_PROJECT_COLUMNS,
  REPORTS_WORK_ENTRY_COLUMNS,
} from './reports.columns'

/**
 * Fetchery raportu. Uzywane WYLACZNIE po stronie serwera (route handler,
 * Server Component) — import w komponencie klienckim wywroci build na
 * `server-only`.
 *
 * Nie filtruja po `user_id`: izolacje robi RLS (`auth.uid() = user_id`),
 * dzieki czemu zapytania startuja rownolegle z `getUser()`.
 */

async function getSupabase() {
  return createClient()
}

/**
 * Wpisy pracy dla OKNA RAPORTU, a nie dla okna dashboardu.
 *
 * Dashboard tnie historie do 24 miesiecy (`getWorkEntriesWindowStart`), bo
 * pokazuje biezacy stan. Raport ma zakres wlasny — moze siegnac po dowolny
 * przedzial, wiec dostaje dokladnie ten, o ktory prosi, i ani dnia wiecej.
 *
 * Filtry ida do SQL, nie do przegladarki: zakres dat, klient i projekt zawezaja
 * wynik po stronie bazy. `status`/`entry_kind` to transportowe odbicie
 * `isPerformedWork` — zrodlem prawdy dla tego invariantu zostaje domena,
 * ktora i tak przepuszcza kazdy wiersz przez ten sam warunek.
 */
export async function fetchReportEntriesServer(
  window: ReportRange,
  clientId: string | null,
  projectId: string | null,
): Promise<ReportEntryRow[]> {
  const supabase = await getSupabase()

  let query = supabase
    .from('work_entries')
    .select(REPORTS_WORK_ENTRY_COLUMNS)
    .gte('date', window.start)
    .lte('date', window.end)
    .eq('status', PERFORMED_WORK_STATUS)
    .eq('entry_kind', 'real')

  if (clientId) query = query.eq('client_id', clientId)
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
    .order('date', { ascending: true })
    .limit(REPORTS_MAX_WORK_ENTRIES)

  if (error) throw new Error(`fetchReportEntriesServer: ${error.message}`)
  return (data ?? []) as unknown as ReportEntryRow[]
}

export async function fetchReportClientsServer(): Promise<ReportClientRef[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select(REPORTS_CLIENT_COLUMNS)
    .limit(REPORTS_MAX_CLIENTS)

  if (error) throw new Error(`fetchReportClientsServer: ${error.message}`)
  return (data ?? []) as unknown as ReportClientRef[]
}

export async function fetchReportProjectsServer(): Promise<ReportProjectRef[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select(REPORTS_PROJECT_COLUMNS)
    .limit(REPORTS_MAX_PROJECTS)

  if (error) throw new Error(`fetchReportProjectsServer: ${error.message}`)
  return (data ?? []) as unknown as ReportProjectRef[]
}

/**
 * Kurs EUR→PLN konta. Raport wyraza wartosc pracy w jednej walucie, wiec musi
 * znac ten sam kurs, ktorego uzywa reszta aplikacji.
 */
export async function fetchReportEurRateServer(userId: string): Promise<number> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('eur_to_pln')
    .eq('id', userId)
    .maybeSingle()

  const rate = Number(data?.eur_to_pln ?? REPORTS_FALLBACK_EUR_RATE)
  return Number.isFinite(rate) && rate > 0 ? rate : REPORTS_FALLBACK_EUR_RATE
}
