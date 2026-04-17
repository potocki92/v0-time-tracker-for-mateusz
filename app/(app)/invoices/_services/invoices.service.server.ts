import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Client, Invoice } from '@/lib/types'
import type { InvoicesData } from '../_domain'

export async function getInvoicesDataServer(): Promise<InvoicesData> {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { invoices: [], clients: [] }
  }

  const [invoicesRes, clientsRes] = await Promise.all([
    supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('clients').select('*').eq('user_id', user.id).order('name', { ascending: true }),
  ])

  if (invoicesRes.error) throw new Error(invoicesRes.error.message)
  if (clientsRes.error) throw new Error(clientsRes.error.message)

  return {
    invoices: (invoicesRes.data ?? []) as Invoice[],
    clients: (clientsRes.data ?? []) as Client[],
  }
}
