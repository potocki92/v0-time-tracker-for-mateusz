'use server'

import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth/server-user'

/**
 * Serwerowe wejscia do sesji uzytkownika.
 *
 * Wczesniej robil to browserowy klient Supabase (`auth.getUser`,
 * `auth.signOut`, `onAuthStateChange`) — a razem z nim caly `supabase-js`
 * (61,8 kB gzip) na kazdej trasie panelu. Sesja i tak zyje w ciasteczkach,
 * wiec serwer czyta ja bez pomocy przegladarki.
 */

/** `true` dopoki ciasteczka sesji sa wazne. Uzywane przez AuthWatcher. */
export async function hasActiveSessionAction(): Promise<boolean> {
  return Boolean(await getServerUser())
}

/**
 * Globalne uniewaznienie sesji — odwoluje refresh token, wiec inne
 * urzadzenia/karty rowniez wylatuja.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
}
