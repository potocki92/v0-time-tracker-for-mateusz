import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getWeekRange } from '@/lib/date/week'
import { toDateKey } from '@/lib/date/format'
import type { Client, Project, WorkEntry } from '@/lib/types'
import { buildWeeklySummary } from '../lib/weekly-summary'
import { formatWeeklySummaryText } from '../components/sections/weekly-summary/format'
import {
  DASHBOARD_CLIENT_COLUMNS,
  DASHBOARD_MAX_CLIENTS,
  DASHBOARD_MAX_PROJECTS,
  DASHBOARD_MAX_WORK_ENTRIES,
  DASHBOARD_PROJECT_COLUMNS,
  DASHBOARD_WORK_ENTRY_COLUMNS,
} from './dashboard.columns'

/**
 * Tresc maila z tygodniowym skrotem dla ksiegowej.
 *
 * Tekst powstaje z tego samego `formatWeeklySummaryText`, co przycisk
 * „Kopiuj" w modalu — mail i schowek nie moga sie rozjechac.
 *
 * `supabase` jest wstrzykiwany, bo maja tu wejsc dwa konteksty: sesja
 * uzytkownika (przycisk „Wyslij teraz", RLS zawezi wiersze) oraz cron na
 * kluczu service-role (bez sesji — stad jawny filtr po `user_id`).
 */

export type WeeklySummaryEmail = {
  subject: string
  text: string
  weekNumber: number
  weekYear: number
  isEmpty: boolean
}

export async function renderWeeklySummaryEmail(
  supabase: SupabaseClient,
  userId: string,
  weekStart: Date = new Date(),
): Promise<WeeklySummaryEmail> {
  const { start, end } = getWeekRange(weekStart)

  const [entries, clients, projects] = await Promise.all([
    supabase
      .from('work_entries')
      .select(DASHBOARD_WORK_ENTRY_COLUMNS)
      .eq('user_id', userId)
      .gte('date', toDateKey(start))
      .lte('date', toDateKey(end))
      .limit(DASHBOARD_MAX_WORK_ENTRIES),
    supabase
      .from('clients')
      .select(DASHBOARD_CLIENT_COLUMNS)
      .eq('user_id', userId)
      .limit(DASHBOARD_MAX_CLIENTS),
    supabase
      .from('projects')
      .select(DASHBOARD_PROJECT_COLUMNS)
      .eq('user_id', userId)
      .limit(DASHBOARD_MAX_PROJECTS),
  ])

  const failed = [entries, clients, projects].find((result) => result.error)
  if (failed?.error) {
    throw new Error(`renderWeeklySummaryEmail: ${failed.error.message}`)
  }

  const summary = buildWeeklySummary(
    (entries.data ?? []) as unknown as WorkEntry[],
    (clients.data ?? []) as unknown as Client[],
    weekStart,
    undefined,
    (projects.data ?? []) as unknown as Project[],
  )

  const text = formatWeeklySummaryText(summary)

  return {
    // Pierwsza linia raportu jest jednoczesnie tematem — ksiegowa widzi
    // KW i zakres dat bez otwierania wiadomosci.
    subject: text.split('\n')[0],
    text,
    weekNumber: summary.weekNumber,
    weekYear: summary.weekYear,
    isEmpty: summary.isEmpty,
  }
}
