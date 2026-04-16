'use server'

/**
 * app/(app)/_actions/auth.actions.ts
 *
 * Server Actions wyciągnięte do osobnego pliku.
 * 'use server' na górze pliku = wszystkie eksporty są Server Actions.
 * Można je bezpiecznie przekazać jako props do Client Components.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}