'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'

/**
 * Pilnuje wygaśnięcia sesji już po wyrenderowaniu panelu.
 *
 * Wcześniej robił to `useAuth` w layoucie — razem z bramką `if (loading)
 * return null`, przez którą SSR całego segmentu `(app)` zwracał pustą stronę
 * i użytkownik czekał na hydrację + round-trip do Supabase Auth. Autoryzacją
 * przy wejściu zajmuje się teraz serwerowy layout; tutaj zostaje wyłącznie
 * reakcja na sign-out (np. z innej karty). Komponent nic nie renderuje,
 * więc niczego nie blokuje.
 */
export function AuthWatcher() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        // performLogout robi twardy redirect; tutaj fallback dla zewnętrznego sign-out.
        router.replace('/auth/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
