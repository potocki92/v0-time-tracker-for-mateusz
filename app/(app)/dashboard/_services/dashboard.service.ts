import { fetchCurrentEurRate } from '@/lib/api/eurRate'
import { createClient } from '@/lib/supabase/client'

export async function fetchDashboardData() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const [clients, entries, invoices, eurRate] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id),
    supabase.from('work_entries').select('*').eq('user_id', user.id),
    supabase.from('invoices').select('*').eq('user_id', user.id),
    fetchCurrentEurRate(),
  ])

  return {
    user,
    clients: clients.data ?? [],
    workEntries: entries.data ?? [],
    invoices: invoices.data ?? [],
    eurRate,
  }
}