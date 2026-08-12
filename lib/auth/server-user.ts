import 'server-only'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

/**
 * Zwraca zalogowanego użytkownika — jeden raz na request.
 *
 * `auth.getUser()` to round-trip do Supabase Auth. Bez deduplikacji layout,
 * page i każdy serwis serwerowy robiłyby własne wywołanie (3–4 round-tripy
 * na jedno wejście na stronę). `cache()` z Reacta trzyma wynik w obrębie
 * jednego requestu, więc płacimy za niego dokładnie raz.
 *
 * Zwraca `null` zamiast rzucać — caller decyduje, czy to redirect,
 * czy pusty stan.
 */
export const getServerUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
})

/**
 * Wariant dla ścieżek, które bez użytkownika nie mają sensu (serwisy danych).
 */
export const requireServerUser = cache(async (): Promise<User> => {
  const user = await getServerUser()
  if (!user) throw new Error('User not authenticated')
  return user
})
