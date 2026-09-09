import createIntlMiddleware from 'next-intl/middleware'
import type { NextRequest, NextResponse } from 'next/server'

import { APP_LOCALES, GEO_COUNTRY_HEADER, LOCALE_COOKIE } from '@/i18n/config'
import { resolveLocale } from '@/i18n/locale'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/proxy'

const handleI18nRouting = createIntlMiddleware(routing)

/**
 * Pierwsze segmenty, ktore wymagaja WAZNEJ SESJI. Landing (`/`, `/de`, `/en`)
 * celowo ich nie zawiera — publiczna wizytowka ma renderowac sie statycznie,
 * bez ani jednego odczytu Supabase.
 */
const SESSION_SEGMENTS = [
  'dashboard',
  'calendar',
  'invoices',
  'clients',
  'projects',
  'settings',
  'auth',
] as const

/** `/dashboard`, `/de/dashboard`, `/en/auth/login` — z prefiksem i bez. */
const SESSION_PATHNAME = new RegExp(
  `^(?:/(?:${APP_LOCALES.join('|')}))?/(?:${SESSION_SEGMENTS.join('|')})(?:/|$)`,
)

/** Jezyk wskazany wprost w adresie — najmocniejszy sygnal w negocjacji. */
function localeFromPathname(pathname: string): string | null {
  const [, head] = pathname.split('/')
  return (APP_LOCALES as readonly string[]).includes(head) ? head : null
}

/**
 * Przepisanie ciasteczek sesji na odpowiedz zwracana uzytkownikowi.
 *
 * To jest dokladnie krok 2 z instrukcji w `lib/supabase/proxy.ts`: warstwa
 * i18n tworzy WLASNA odpowiedz (rewrite albo redirect), wiec bez tej petli
 * odswiezone tokeny nigdy nie dotarlyby do przegladarki i uzytkownik
 * wylatywalby z sesji w losowym momencie.
 */
function carryOverSessionCookies(target: NextResponse, session: NextResponse): NextResponse {
  for (const cookie of session.cookies.getAll()) target.cookies.set(cookie)
  return target
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const needsSession = SESSION_PATHNAME.test(pathname)

  // 1. Sesja PRZED routingiem jezykowym. `updateSession` odswieza ciasteczka
  //    Supabase takze na `request`, wiec rewrite tworzony nizej przez
  //    `next-intl` niesie juz swieze tokeny do Server Components.
  const session = needsSession ? await updateSession(request) : null

  // 2. Negocjacja jezyka. Jedno miejsce, jedna czysta funkcja.
  const { locale } = resolveLocale({
    explicit: localeFromPathname(pathname),
    userPreference: session?.preferredLocale,
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    country: request.headers.get(GEO_COUNTRY_HEADER),
    acceptLanguage: request.headers.get('accept-language'),
  })

  // 3. Wynik negocjacji podajemy `next-intl` jedynym kanalem, ktory biblioteka
  //    czyta przed `Accept-Language` — ciasteczkiem NA ZADANIU. Nie zapisuje
  //    sie ono w przegladarce (patrz `i18n/routing.ts`), wiec wykrycie po IP
  //    pozostaje jednorazowa podpowiedzia, a nie cicha decyzja za uzytkownika.
  request.cookies.set(LOCALE_COOKIE, locale)

  const response = handleI18nRouting(request)

  return session ? carryOverSessionCookies(response, session.response) : response
}

export const config = {
  matcher: [
    /*
     * Wszystkie trasy STRON — takze `/`, bo landing ma swoje wersje jezykowe
     * i to middleware decyduje, czy Niemiec dostanie `/de`.
     *
     * Poza matcherem zostaja rzeczy, ktore nie maja jezyka:
     *   • /api            — kontrakt maszynowy,
     *   • /_next, /_vercel — wewnetrzne zasoby frameworka,
     *   • /sw.js, /manifest.webmanifest, /robots.txt, /sitemap.xml,
     *   • wszystko z kropka w nazwie (obrazki, fonty, favicon, pliki statyczne).
     */
    '/((?!api|_next|_vercel|sw\\.js|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
  ],
}
