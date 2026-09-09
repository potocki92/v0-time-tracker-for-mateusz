'use server'

import { cookies } from 'next/headers'

import { isAppLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type AppLocale } from './config'

/**
 * Zapis SWIADOMEGO wyboru jezyka.
 *
 * Ciasteczko jest zrodlem prawdy dla SSR: middleware czyta je przed
 * renderowaniem dokumentu, wiec serwer od razu oddaje wlasciwy jezyk i nie ma
 * przeskoku po hydracji. `localStorage` nie moze tego zrobic — serwer go nie
 * widzi.
 *
 * Dla zalogowanego uzytkownika dopisujemy jeszcze `preferred_locale` do
 * metadanych konta. To synchronizacja MIEDZY URZADZENIAMI, a nie sciezka
 * krytyczna: gdy w zadaniu nie ma ciasteczka sesji Supabase, w ogole nie
 * dotykamy bazy — publiczny landing ma dzialac bez sesji.
 */
export async function setPreferredLocaleAction(locale: string): Promise<void> {
  if (!isAppLocale(locale)) return

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  const hasSupabaseSession = cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'))
  if (!hasSupabaseSession) return

  await syncAccountLocale(locale)
}

/**
 * Wydzielone, zeby import Supabase byl leniwy: bez sesji modul nawet sie nie
 * laduje, wiec sciezka publiczna zostaje bez zaleznosci od auth.
 */
async function syncAccountLocale(locale: AppLocale): Promise<void> {
  try {
    const [{ createClient }, { getServerUser }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/auth/server-user'),
    ])

    const user = await getServerUser()
    if (!user) return
    if (user.user_metadata?.preferred_locale === locale) return

    const supabase = await createClient()
    await supabase.auth.updateUser({
      data: { ...(user.user_metadata ?? {}), preferred_locale: locale },
    })
  } catch {
    // Jezyk jest juz zapisany w ciasteczku — nieudana synchronizacja konta nie
    // moze wywrocic przelaczenia jezyka.
  }
}
