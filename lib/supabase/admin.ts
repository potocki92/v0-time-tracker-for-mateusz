import 'server-only'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Klient na kluczu service-role — omija RLS, wiec wolno go uzyc wylacznie
 * tam, gdzie nie ma sesji uzytkownika (cron tygodniowego skrotu).
 *
 * Kazde zapytanie tym klientem MUSI samo filtrowac po `user_id`; bez sesji
 * `auth.uid()` jest puste i baza niczego juz nie zawezi.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('Brak NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
