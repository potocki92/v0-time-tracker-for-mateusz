import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * TEST KRYTYCZNY.
 *
 * Warstwa i18n tworzy WLASNA odpowiedz (rewrite albo redirect), a ciasteczka
 * sesji ustawia `updateSession` na SWOJEJ. Jesli middleware nie przepisze ich
 * na odpowiedz zwracana uzytkownikowi, odswiezone tokeny nigdy nie dotra do
 * przegladarki i uzytkownik zacznie losowo wylatywac z sesji — dokladnie to
 * ostrzezenie stoi w `lib/supabase/proxy.ts`.
 *
 * Ten plik pilnuje, ze i18n dziala, a sesja przezywa.
 */
const REFRESHED = [
  { name: 'sb-abcdef-auth-token', value: 'refreshed-access-token' },
  { name: 'sb-abcdef-auth-token.1', value: 'refreshed-refresh-token' },
]

const session = vi.hoisted(() => ({ preferredLocale: null as string | null }))

vi.mock('@/lib/supabase/proxy', async () => {
  const { NextResponse } = await import('next/server')
  return {
    updateSession: vi.fn(async (request: NextRequest) => {
      // Dokladnie to, co robi prawdziwy `setAll` z `@supabase/ssr`.
      const response = NextResponse.next({ request })
      for (const cookie of REFRESHED) {
        response.cookies.set(cookie.name, cookie.value, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        })
      }
      return { response, preferredLocale: session.preferredLocale }
    }),
  }
})

const { middleware } = await import('@/middleware')

const BASE = 'https://timetracker.test'

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, BASE), { headers: new Headers(headers) })
}

function sessionCookies(response: Response) {
  return REFRESHED.map((cookie) => {
    const value = (response as unknown as { cookies: { get(name: string): { value: string } | undefined } })
      .cookies.get(cookie.name)
    return [cookie.name, value?.value] as const
  })
}

beforeEach(() => {
  session.preferredLocale = null
})

describe('middleware — ciasteczka Supabase przezywaja warstwe i18n', () => {
  it('zostaja na odpowiedzi, gdy i18n tylko przepisuje adres', async () => {
    const response = await middleware(request('/dashboard'))

    expect(response.headers.get('x-middleware-rewrite')).toBeTruthy()
    expect(sessionCookies(response)).toEqual([
      ['sb-abcdef-auth-token', 'refreshed-access-token'],
      ['sb-abcdef-auth-token.1', 'refreshed-refresh-token'],
    ])
  })

  it('zostaja na odpowiedzi, gdy i18n PRZEKIEROWUJE na inny jezyk', async () => {
    // Najgrozniejszy przypadek: redirect tworzy zupelnie nowa odpowiedz.
    const response = await middleware(
      request('/dashboard', { 'x-vercel-ip-country': 'DE' }),
    )

    expect(response.status).toBe(307)
    expect(sessionCookies(response)).toEqual([
      ['sb-abcdef-auth-token', 'refreshed-access-token'],
      ['sb-abcdef-auth-token.1', 'refreshed-refresh-token'],
    ])
  })

  it('zostaja na trasie auth z prefiksem jezyka', async () => {
    const response = await middleware(request('/de/auth/login'))

    expect(sessionCookies(response)).toEqual([
      ['sb-abcdef-auth-token', 'refreshed-access-token'],
      ['sb-abcdef-auth-token.1', 'refreshed-refresh-token'],
    ])
  })

  it('trafiaja do naglowka Set-Cookie, a nie tylko do obiektu odpowiedzi', async () => {
    const response = await middleware(request('/invoices'))
    const setCookie = response.headers.getSetCookie().join('\n')

    for (const cookie of REFRESHED) {
      expect(setCookie).toContain(`${cookie.name}=${cookie.value}`)
      expect(setCookie).toMatch(new RegExp(`${cookie.name.replace('.', '\\.')}[^\\n]*HttpOnly`, 'i'))
    }
  })

  it('publiczny landing nie ustawia zadnego ciasteczka sesji', async () => {
    const response = await middleware(request('/'))

    for (const cookie of REFRESHED) {
      expect(
        (response as unknown as { cookies: { get(name: string): unknown } }).cookies.get(cookie.name),
      ).toBeUndefined()
    }
  })
})
