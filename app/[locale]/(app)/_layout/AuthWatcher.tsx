'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { hasActiveSessionAction } from '@/lib/auth/actions'

/**
 * Pilnuje wygaśnięcia sesji już po wyrenderowaniu panelu.
 *
 * Wcześniej robił to `useAuth` w layoucie — razem z bramką `if (loading)
 * return null`, przez którą SSR całego segmentu `(app)` zwracał pustą stronę
 * i użytkownik czekał na hydrację + round-trip do Supabase Auth. Autoryzacją
 * przy wejściu zajmuje się teraz serwerowy layout; tutaj zostaje wyłącznie
 * reakcja na sign-out (np. z innej karty). Komponent nic nie renderuje,
 * więc niczego nie blokuje.
 *
 * Sondą jest Server Action zamiast `onAuthStateChange` — subskrypcja GoTrue
 * wymagałaby browserowego klienta Supabase, czyli 61,8 kB gzip na każdej
 * trasie panelu. Sesja siedzi w ciasteczkach, więc pytamy o nią serwer, gdy
 * karta wraca na wierzch: to moment, w którym sign-out z innej karty i tak
 * musi być widoczny.
 */
export function AuthWatcher() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (document.visibilityState !== 'visible') return

      try {
        const active = await hasActiveSessionAction()
        if (!cancelled && !active) {
          // performLogout robi twardy redirect; tutaj fallback dla zewnętrznego sign-out.
          router.replace('/auth/login')
        }
      } catch {
        // Offline / chwilowy błąd sieci — nie wyrzucamy użytkownika z panelu.
      }
    }

    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)

    return () => {
      cancelled = true
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [router])

  return null
}
