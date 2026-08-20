'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'
import type { ProjectFormData } from '@/lib/types'

/**
 * Server Actions modulu Projects.
 *
 * `user_id` pochodzi z sesji serwerowej, nie z requestu. Supabase jedzie na
 * anon key + ciasteczkach, wiec RLS nadal decyduje o zakresie zapisu.
 */

const projectPayloadSchema = z.object({
  client_id:       z.string().uuid('Wybierz klienta').or(z.literal('')),
  name:            z.string().trim().min(1, 'Nazwa projektu jest wymagana').max(120, 'Maks. 120 znaków'),
  description:     z.string().trim().max(2000).optional(),
  address:         z.string().trim().max(200).optional(),
  status:          z.enum(['planned', 'in_progress', 'completed', 'on_hold']),
  budget_type:     z.enum(['per_unit', 'fixed', 'hourly']),
  budget_amount:   z.number().nonnegative().optional(),
  target_quantity: z.number().nonnegative().optional(),
  priority:        z.enum(['low', 'medium', 'high']),
  color:           z.string().regex(/^#[0-9a-f]{6}$/i, 'Kolor musi być w formacie hex'),
  start_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowa data').or(z.literal('')).optional(),
  end_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowa data').or(z.literal('')).optional(),
})

const uuidSchema = z.string().uuid('Nieprawidłowy identyfikator')

type ProjectPayload = z.infer<typeof projectPayloadSchema>

function firstIssue(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

function toProjectRow(userId: string, formData: ProjectPayload) {
  return {
    user_id: userId,
    client_id: formData.client_id || null,
    name: formData.name,
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

function revalidateProjects() {
  revalidatePath('/projects')
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
}

// ── Mutacje ───────────────────────────────────────────────────────────────────

export async function createProjectAction(formData: ProjectFormData): Promise<void> {
  const parsed = projectPayloadSchema.safeParse(formData)
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowe dane projektu'))

  const user = await requireServerUser()
  const supabase = await createClient()

  const { error } = await supabase.from('projects').insert(toProjectRow(user.id, parsed.data))
  if (error) throw new Error(`createProject: ${error.message}`)

  revalidateProjects()
}

export async function updateProjectAction(
  id: string,
  formData: ProjectFormData,
): Promise<void> {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy projekt'))

  const parsed = projectPayloadSchema.safeParse(formData)
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowe dane projektu'))

  const user = await requireServerUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .update(toProjectRow(user.id, parsed.data))
    .eq('id', parsedId.data)
  if (error) throw new Error(`updateProject: ${error.message}`)

  revalidateProjects()
}

export async function deleteProjectAction(id: string): Promise<void> {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy projekt'))

  const supabase = await createClient()

  const { error } = await supabase.from('projects').delete().eq('id', parsedId.data)
  if (error) throw new Error(`deleteProject: ${error.message}`)

  revalidateProjects()
}
