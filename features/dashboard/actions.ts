'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'
import type { Currency, Goal } from './types/dashboard.types'

/**
 * Server Actions modulu Dashboard.
 *
 * Preferencje siedza w `auth.users.user_metadata`, wiec zapis idzie przez
 * `auth.updateUser` na sesji serwerowej — anon key + ciasteczka, bez
 * service-role.
 */

export type DashboardPreferences = {
  eurToPln?: number
  useLiveRate: boolean
  goal: Goal | null
  displayCurrency: Currency
}

const CURRENCY = z.enum(['PLN', 'EUR'])

const preferencesSchema = z.object({
  eurToPln:        z.number().positive('Kurs musi być większy niż 0').optional(),
  useLiveRate:     z.boolean(),
  goal:            z.object({ amount: z.number().nonnegative().nullable(), currency: CURRENCY }).nullable(),
  displayCurrency: CURRENCY,
})

export async function updateDashboardPreferencesAction(
  input: DashboardPreferences,
): Promise<void> {
  const parsed = preferencesSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Nieprawidłowe preferencje')
  }

  await requireServerUser()
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    data: {
      eur_to_pln: parsed.data.eurToPln,
      use_live_rate: parsed.data.useLiveRate,
      goal_amount: parsed.data.goal?.amount ?? null,
      goal_currency: parsed.data.goal?.currency ?? null,
      display_currency: parsed.data.displayCurrency,
    },
  })

  if (error) throw error

  revalidatePath('/dashboard')
}
