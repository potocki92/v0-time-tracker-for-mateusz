'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'
import type { WorkEntry } from '@/lib/types'
import type { EntryFormValues } from './domain/calendar.types'

/**
 * Server Actions modulu Calendar.
 *
 * Wpis pracy sklada sie tutaj, a nie w hooku — dzieki temu `user_id`, status
 * i pola rozliczeniowe wyliczaja sie po stronie serwera, po walidacji Zodem.
 * Supabase jedzie na anon key + ciasteczkach, wiec RLS nadal obowiazuje.
 */

const entryFormSchema = z.object({
  entryKind:    z.enum(['real', 'predicted']),
  status:       z.enum(['worked', 'not_worked', 'vacation', 'sick_leave', 'day_off']),
  clientId:     z.string().uuid('Nieprawidłowy klient').or(z.literal('')).optional(),
  projectId:    z.string().uuid('Nieprawidłowy projekt').or(z.literal('')).or(z.literal('none')).optional(),
  hours:        z.number().min(0).max(24, 'Maks. 24 godziny'),
  quantityFrom: z.number().min(0),
  quantityTo:   z.number().min(0),
  notes:        z.string().trim().max(2000).optional(),
})

const saveEntrySchema = z.object({
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowa data'),
  form:       entryFormSchema,
  workType:   z.enum(['hourly', 'piecework']).optional(),
  existingId: z.string().uuid('Nieprawidłowy wpis').optional(),
})

const uuidSchema = z.string().uuid('Nieprawidłowy wpis')

export interface SaveWorkEntryInput {
  date: string
  form: EntryFormValues
  workType: 'hourly' | 'piecework' | undefined
  existingId?: string
}

function firstIssue(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

function revalidateCalendar() {
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
}

// ── Mutacje ───────────────────────────────────────────────────────────────────

export async function saveWorkEntryAction(input: SaveWorkEntryInput): Promise<WorkEntry> {
  const parsed = saveEntrySchema.safeParse(input)
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowy wpis'))

  const { date, form, workType, existingId } = parsed.data
  const user = await requireServerUser()
  const supabase = await createClient()

  const status = form.entryKind === 'predicted' ? 'worked' : form.status

  const isWorked = status === 'worked'
  const isHourly = isWorked && workType === 'hourly'
  const isPiecework = isWorked && workType === 'piecework'

  const payload = {
    user_id: user.id,
    date,
    status,
    entry_kind: form.entryKind,
    client_id: isWorked ? form.clientId || null : null,
    project_id:
      isWorked && form.projectId && form.projectId !== 'none' ? form.projectId : null,
    hours: isHourly ? form.hours : null,
    quantity: isPiecework ? form.quantityTo - form.quantityFrom : null,
    quantity_from: isPiecework ? form.quantityFrom : null,
    quantity_to: isPiecework ? form.quantityTo : null,
    notes: form.notes || null,
  }

  const query = existingId
    ? supabase.from('work_entries').update(payload).eq('id', existingId).select().single()
    : supabase.from('work_entries').insert(payload).select().single()

  const { data, error } = await query
  if (error) throw new Error(`upsertWorkEntry: ${error.message}`)

  revalidateCalendar()
  return data as WorkEntry
}

export async function deleteWorkEntryAction(entryId: string): Promise<void> {
  const parsedId = uuidSchema.safeParse(entryId)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy wpis'))

  const supabase = await createClient()
  const { error } = await supabase.from('work_entries').delete().eq('id', parsedId.data)

  if (error) throw new Error(`deleteWorkEntry: ${error.message}`)

  revalidateCalendar()
}
