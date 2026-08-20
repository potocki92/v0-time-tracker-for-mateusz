import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and the auth call below.

  // `getClaims()` zamiast `getUser()`: weryfikuje JWT lokalnie przez JWKS,
  // bez round-tripu do GoTrue. Middleware odpala sie na KAZDYM zadaniu —
  // takze na kazdym requescie RSC przy nawigacji — wiec ten round-trip
  // placilismy przy kazdym kliknieciu w sidebarze, jeszcze przed layoutem,
  // ktory i tak wola `getServerUser()`.
  //
  // Rola middleware jest tu wylacznie odswiezenie ciasteczek sesji.
  // Autoryzacja zostaje w `app/(app)/layout.tsx` (`getServerUser()` -> redirect).
  //
  // WARUNEK: projekt Supabase musi miec asymetryczne klucze podpisu JWT
  // (Dashboard -> Authentication -> JWT Keys -> migracja na ECC P-256).
  // Przy kluczu symetrycznym getClaims() robi fallback na wywolanie sieciowe
  // i nic nie zyskujemy — patrz docs/perf-baseline.md.
  await supabase.auth.getClaims()

  // NOTE:
  // We intentionally do not force unauthenticated redirects here for app routes.
  // In some environments `signInWithPassword` session propagation to middleware cookies
  // can lag behind the client state (local/session storage), causing redirect loops
  // right after successful login. Protected screens perform their own user checks.
  //
  // `/` (landing) jest obsługiwane po stronie page.tsx (server component),
  // dzięki czemu CDN może cache'ować publiczny landing bez nadmiarowych redirectów.

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
