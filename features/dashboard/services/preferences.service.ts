import { createClient } from '@/lib/supabase/client'
import type { Currency, Goal } from '../types/dashboard.types'

export type DashboardPreferences = {
  eurToPln?: number
  useLiveRate: boolean
  goal: Goal | null
  displayCurrency: Currency
}

export async function fetchDashboardPreferences(): Promise<DashboardPreferences | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const eurToPln = Number(meta.eur_to_pln)
  const goalAmount = Number(meta.goal_amount)

  return {
    eurToPln: Number.isFinite(eurToPln) && eurToPln > 0 ? eurToPln : undefined,
    useLiveRate: meta.use_live_rate !== false,
    goal:
      Number.isFinite(goalAmount) && goalAmount > 0
        ? {
            amount: goalAmount,
            currency: (meta.goal_currency as Currency) ?? 'PLN',
          }
        : null,
    displayCurrency: (meta.display_currency as Currency) ?? 'PLN',
  }
}

export async function updateDashboardPreferences(input: DashboardPreferences): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    data: {
      eur_to_pln: input.eurToPln,
      use_live_rate: input.useLiveRate,
      goal_amount: input.goal?.amount ?? null,
      goal_currency: input.goal?.currency ?? null,
      display_currency: input.displayCurrency,
    },
  })

  if (error) throw error
}
