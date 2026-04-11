import { createClient } from '@/lib/supabase/server'
import { fetchCurrentEurRate } from '@/lib/api/eurRate'
import { DEFAULT_EUR_TO_PLN } from '../_domain/dashboard.constants'
import { DashboardData } from '../_domain/dashboard.types'

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const metadata = user.user_metadata ?? {}

  const name =
    metadata.full_name ||
    metadata.name ||
    user.email?.split('@')[0] ||
    'Użytkowniku'

  const eurRateFromUser = Number(metadata.eur_to_pln)

  const [eurRateLive, clientsRes, entriesRes, invoicesRes] =
    await Promise.all([
      fetchCurrentEurRate(),
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('work_entries').select('*').eq('user_id', user.id),
      supabase.from('invoices').select('*').eq('user_id', user.id),
    ])

  return {
    userName: name,
    eurToPlnRate:
      eurRateFromUser > 0
        ? eurRateFromUser
        : eurRateLive ?? DEFAULT_EUR_TO_PLN,
    clients: clientsRes.data ?? [],
    workEntries: entriesRes.data ?? [],
    invoices: invoicesRes.data ?? [],
  }
}