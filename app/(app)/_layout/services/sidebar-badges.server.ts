import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Liczba nieopłaconych faktur pokazywana jako badge przy „Faktury”.
 *
 * Wcześniej liczył to kliencki hook, który na KAŻDEJ stronie panelu pobierał
 * komplet faktur i klientów tylko po to, by pokazać jedną liczbę. Tutaj
 * schodzi to do pojedynczego `count` (head: true — baza nie odsyła wierszy),
 * trafiającego w indeks `idx_invoices_user_status`.
 *
 * Badge jest ozdobny: przy błędzie zwracamy 0 zamiast wywracać cały panel.
 */
export async function fetchUnpaidInvoicesCount(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('is_paid', false)
    .not('status', 'in', '("PAID","CANCELLED")')

  if (error) return 0
  return count ?? 0
}
