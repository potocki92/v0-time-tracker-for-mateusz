'use server'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'

import {
  resumeWorkSchema,
  workAutomationSettingsSchema,
  type AutomationOverview,
  type WorkAutomationSettingsInput,
} from './domain'
import {
  fetchClient,
  fetchProject,
  fetchSettings,
  insertResumption,
  saveSettings,
} from './services/workAutomation.repository.server'
import { loadAutomationOverview } from './services/workAutomation.overview.server'

/**
 * Server Actions modulu Work Automation.
 *
 * Supabase jedzie na anon key + ciasteczkach sesji, wiec RLS decyduje, czyja
 * konfiguracje wolno przeczytac i zapisac. Uzytkownik nie ma dostepu do cudzej
 * konfiguracji ani do dziennika decyzji innego konta.
 */

function firstIssue(error: { issues: { message: string }[] }, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

export async function fetchWorkAutomationOverviewAction(): Promise<AutomationOverview> {
  const user = await requireServerUser()
  const supabase = await createClient()

  return loadAutomationOverview(supabase, user.id)
}

export async function updateWorkAutomationSettingsAction(
  values: WorkAutomationSettingsInput,
): Promise<void> {
  const parsed = workAutomationSettingsSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error(firstIssue(parsed.error, 'Nieprawidłowe ustawienia automatu'))
  }

  const user = await requireServerUser()
  const supabase = await createClient()
  const { clientId, projectId } = parsed.data

  // Klient i projekt musza nalezec do uzytkownika, a projekt do wybranego
  // klienta — inaczej zapisalibysmy konfiguracje wskazujaca cudze dane.
  if (clientId) {
    const client = await fetchClient(supabase, user.id, clientId)
    if (!client) throw new Error('Wybrany klient nie istnieje')
    if (client.workType !== 'hourly') {
      throw new Error('Automat obsługuje na razie wyłącznie klientów rozliczanych godzinowo')
    }
  }

  if (projectId) {
    const project = await fetchProject(supabase, user.id, projectId)
    if (!project) throw new Error('Wybrany projekt nie istnieje')
    if (project.clientId !== clientId) {
      throw new Error('Wybrany projekt należy do innego klienta')
    }
  }

  await saveSettings(supabase, user.id, {
    enabled: parsed.data.enabled,
    startDate: parsed.data.startDate,
    runTime: parsed.data.runTime,
    timeZone: parsed.data.timeZone,
    weekSchedule: parsed.data.weekSchedule,
    clientId: clientId || null,
    projectId: projectId || null,
  })
}

/**
 * Jawne wznowienie pracy po powrocie do domu.
 *
 * To osobna, swiadoma decyzja uzytkownika — zwykla edycja godziny zapisu nie
 * moze zadzialac jak wznowienie, bo automat nie odroznilby „pracuje dalej"
 * od „poprawiam ustawienia".
 */
export async function resumeWorkAction(resumeDate: string): Promise<void> {
  const parsed = resumeWorkSchema.safeParse({ resumeDate })
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowa data wznowienia'))

  const user = await requireServerUser()
  const supabase = await createClient()

  const settings = await fetchSettings(supabase, user.id)
  if (!settings) throw new Error('Najpierw zapisz konfigurację automatu')
  if (parsed.data.resumeDate < settings.startDate) {
    throw new Error('Data wznowienia nie może być wcześniejsza niż data uruchomienia automatu')
  }

  await insertResumption(supabase, user.id, parsed.data.resumeDate)
}
