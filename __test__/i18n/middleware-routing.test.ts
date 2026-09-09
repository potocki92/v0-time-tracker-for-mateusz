import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Routing jezykowy sprawdzany na PRAWDZIWYM middleware, nie na atrapie.
 *
 * `updateSession` (Supabase) jest jedyna rzecza podmieniona — inaczej test
 * probowalby zawolac sieciowe API Auth. Cala reszta, lacznie z `next-intl`,
 * jest produkcyjna.
 */
const session = vi.hoisted(() => ({
  calls: [] as string[],
  preferredLocale: null as string | null,
  cookies: [] as { name: string; value: string }[],
}))

vi.mock('@/lib/supabase/proxy', async () => {
  const { NextResponse } = await import('next/server')
  return {
    updateSession: vi.fn(async (request: NextRequest) => {
      session.calls.push(request.nextUrl.pathname)
      const response = NextResponse.next({ request })
      for (const cookie of session.cookies) {
        response.cookies.set(cookie.name, cookie.value, { path: '/', httpOnly: true })
      }
      return { response, preferredLocale: session.preferredLocale }
    }),
  }
})

const { middleware } = await import('@/middleware')

const BASE = 'https://timetracker.test'

function request(
  path: string,
  init: { country?: string; acceptLanguage?: string; cookie?: string } = {},
) {
  const headers = new Headers()
  if (init.country) headers.set('x-vercel-ip-country', init.country)
  if (init.acceptLanguage) headers.set('accept-language', init.acceptLanguage)
  if (init.cookie) headers.set('cookie', `NEXT_LOCALE=${init.cookie}`)
  return new NextRequest(new URL(path, BASE), { headers })
}

/**
 * Adres, pod ktory middleware faktycznie kieruje.
 *
 * `next-intl` uzywa trzech wyjsc: `Location` (redirect), `x-middleware-rewrite`
 * (przepisanie na segment `[locale]`) albo braku obu — gdy adres juz jest
 * docelowy. Ostatni przypadek zwraca sciezke wejsciowa, zeby assert mowil o
 * tym samym, o czym mowi przegladarka.
 */
function target(response: Response, requestedPath: string): string {
  const url = response.headers.get('location') ?? response.headers.get('x-middleware-rewrite')
  if (!url) return requestedPath
  const parsed = new URL(url, BASE)
  return parsed.pathname + parsed.search
}

beforeEach(() => {
  session.calls = []
  session.preferredLocale = null
  session.cookies = []
})

describe('routing jezykowy — landing', () => {
  it('`/` bez preferencji zostaje polskim (bez prefiksu w adresie)', async () => {
    const response = await middleware(request('/'))
    expect(response.status).toBe(200)
    expect(target(response, '/')).toBe('/pl')
  })

  it('`/` z Niemiec przekierowuje na `/de`', async () => {
    const response = await middleware(request('/', { country: 'DE' }))
    expect(response.status).toBe(307)
    expect(target(response, '/')).toBe('/de')
  })

  it('`/de` i `/en` serwuja swoje wersje bez przekierowania', async () => {
    for (const locale of ['de', 'en']) {
      const response = await middleware(request(`/${locale}`))
      expect(response.status).toBe(200)
      expect(target(response, `/${locale}`)).toBe(`/${locale}`)
    }
  })

  it('`/pl` przekierowuje na `/` — jezyk bazowy ma JEDEN adres', async () => {
    const response = await middleware(request('/pl'))
    expect(response.status).toBe(307)
    expect(target(response, '/pl')).toBe('/')
  })
})

describe('routing jezykowy — panel', () => {
  it('`/dashboard` bez preferencji zostaje polski', async () => {
    const response = await middleware(request('/dashboard'))
    expect(target(response, '/dashboard')).toBe('/pl/dashboard')
  })

  it('`/de/dashboard` i `/en/dashboard` trafiaja w swoje wersje', async () => {
    for (const locale of ['de', 'en']) {
      const response = await middleware(request(`/${locale}/dashboard`))
      expect(response.status).toBe(200)
      expect(target(response, `/${locale}/dashboard`)).toBe(`/${locale}/dashboard`)
    }
  })

  it('zachowuje query string przy przekierowaniu jezykowym', async () => {
    const response = await middleware(
      request('/dashboard?range=current_week', { country: 'DE' }),
    )
    expect(response.status).toBe(307)
    expect(target(response, '/dashboard')).toBe('/de/dashboard?range=current_week')
  })

  it('jezyk konta wygrywa z geolokalizacja', async () => {
    session.preferredLocale = 'en'
    const response = await middleware(request('/dashboard', { country: 'DE' }))
    expect(target(response, '/dashboard')).toBe('/en/dashboard')
  })

  it('nieobslugiwany prefiks nie jest jezykiem — leci do 404 aplikacji', async () => {
    // `/fr` nie jest w rejestrze, wiec `next-intl` traktuje go jak zwykly
    // segment sciezki jezyka bazowego, a nie jak wersje jezykowa.
    const response = await middleware(request('/fr'))
    expect(target(response, '/fr')).toBe('/pl/fr')
  })
})

describe('routing jezykowy — granica sesji', () => {
  it('landing NIE dotyka Supabase w zadnej wersji jezykowej', async () => {
    for (const path of ['/', '/de', '/en']) await middleware(request(path))
    expect(session.calls).toEqual([])
  })

  it('trasy panelu i auth odswiezaja sesje — takze z prefiksem jezyka', async () => {
    for (const path of ['/dashboard', '/de/dashboard', '/en/auth/login', '/invoices']) {
      await middleware(request(path))
    }
    expect(session.calls).toEqual([
      '/dashboard',
      '/de/dashboard',
      '/en/auth/login',
      '/invoices',
    ])
  })
})

describe('routing jezykowy — trwalosc wyboru', () => {
  it('ciasteczko uzytkownika wygrywa z krajem', async () => {
    const response = await middleware(request('/', { country: 'DE', cookie: 'pl' }))
    expect(response.status).toBe(200)
    expect(target(response, '/')).toBe('/pl')
  })

  it('wykrycie po IP NIE zapisuje sie w przegladarce', async () => {
    // Gdyby `next-intl` odeslal `Set-Cookie`, geolokalizacja utrwalilaby sie
    // jako „decyzja uzytkownika" — a ma byc tylko pierwsza podpowiedzia.
    const response = await middleware(request('/', { country: 'DE' }))
    expect(response.headers.get('set-cookie')).toBeNull()
  })
})
