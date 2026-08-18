import { createClient } from '@/lib/supabase/client'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, Project, ProjectFormData, WorkEntry } from '@/lib/types'
import {
  PROJECTS_CLIENT_COLUMNS,
  PROJECTS_MAX_CLIENTS,
  PROJECTS_MAX_PROJECTS,
  PROJECTS_MAX_WORK_ENTRIES,
  PROJECTS_PROJECT_COLUMNS,
  PROJECTS_WORK_ENTRY_COLUMNS,
} from './projects.columns'

/**
 * Surowe funkcje fetch dla modułu Projects — tylko transport, bez logiki
 * biznesowej. Każda funkcja owija jeden zasób z Supabase i jest izolowana
 * od reszty aplikacji (Micro-SaaS boundary).
 */

function getSupabase() {
  return createClient()
}

// ── Resource fetchers ─────────────────────────────────────────────────────────

export async function fetchProjects(userId: string): Promise<Project[]> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select(PROJECTS_PROJECT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PROJECTS_MAX_PROJECTS)

  if (error) throw new Error(`fetchProjects: ${error.message}`)
  return (data ?? []) as Project[]
}

export async function fetchProjectsClients(userId: string): Promise<Client[]> {
  const { data, error } = await getSupabase()
    .from('clients')
    .select(PROJECTS_CLIENT_COLUMNS)
    .eq('user_id', userId)
    .order('name')
    .limit(PROJECTS_MAX_CLIENTS)

  if (error) throw new Error(`fetchProjectsClients: ${error.message}`)
  return (data ?? []) as Client[]
}

export async function fetchProjectsWorkEntries(userId: string): Promise<WorkEntry[]> {
  const { data, error } = await getSupabase()
    .from('work_entries')
    .select(PROJECTS_WORK_ENTRY_COLUMNS)
    .eq('user_id', userId)
    .gte('date', getWorkEntriesWindowStart())
    .limit(PROJECTS_MAX_WORK_ENTRIES)

  if (error) throw new Error(`fetchProjectsWorkEntries: ${error.message}`)
  return (data ?? []) as WorkEntry[]
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function fetchCurrentUser() {
  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser()
  if (error || !user) throw new Error('User not authenticated')
  return user
}

// ── Mutacje ───────────────────────────────────────────────────────────────────

export type ProjectPayload = Omit<Project, 'id' | 'created_at' | 'current_quantity'>

export function toProjectPayload(userId: string, formData: ProjectFormData): ProjectPayload {
  return {
    user_id: userId,
    client_id: formData.client_id || (null as unknown as string),
    name: formData.name.trim(),
    description: formData.description?.trim() || null,
    address: formData.address?.trim() || null,
    status: formData.status,
    budget_type: formData.budget_type,
    budget_amount:
      formData.budget_amount && formData.budget_amount > 0 ? formData.budget_amount : null,
    target_quantity:
      formData.target_quantity && formData.target_quantity > 0 ? formData.target_quantity : null,
    priority: formData.priority,
    color: formData.color,
    start_date: formData.start_date || null,
    end_date: formData.end_date || null,
  }
}

export async function createProject(payload: ProjectPayload): Promise<void> {
  const { error } = await getSupabase().from('projects').insert(payload)
  if (error) throw new Error(`createProject: ${error.message}`)
}

export async function updateProject(id: string, payload: ProjectPayload): Promise<void> {
  const { error } = await getSupabase().from('projects').update(payload).eq('id', id)
  if (error) throw new Error(`updateProject: ${error.message}`)
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await getSupabase().from('projects').delete().eq('id', id)
  if (error) throw new Error(`deleteProject: ${error.message}`)
}
