import { createClient } from '@/lib/supabase/client'
import type { Currency, Goal } from '../types/dashboard.types'

export type DashboardPreferences = {
  eurToPln?: number
  useLiveRate: boolean
  goal: Goal | null
  displayCurrency: Currency
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
