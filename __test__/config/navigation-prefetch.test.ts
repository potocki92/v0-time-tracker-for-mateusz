import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const registry = read('hooks/prefetch/prefetchRegistry.ts')
const sidebar = read('app/(app)/_layout/components/sidebar/SidebarNav.tsx')
const bottomNav = read('app/(app)/_layout/components/bottom-nav/BottomNav.tsx')

describe('prefetch — rejestr', () => {
  it('kazda trasa w rejestrze istnieje w app/(app)', () => {
    const routes = [...registry.matchAll(/'(\/[a-z-]+)':\s*\{/g)].map((m) => m[1])
    expect(routes.length, 'rejestr jest pusty — regex przestal pasowac').toBeGreaterThanOrEqual(3)

    const segments = readdirSync(resolve(ROOT, 'app/(app)'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
      .map((e) => `/${e.name}`)

    for (const route of routes) {
      expect(segments, `rejestr wskazuje na nieistniejaca trase ${route}`).toContain(route)
    }
  })

  /**
   * Rejestr jest importowany przez sidebar, a sidebar jest na KAZDEJ stronie
   * panelu. Wszystko, po co siegnie rejestr, wchodzi wiec do bundla kazdej
   * trasy — i zysk z prefetchu zaczyna platnic za wlasny koszt.
   *
   * Trzyma go przy ziemi to, ze queryFn to zapytanie do route handlera,
   * a nie funkcja z modulu sekcji: do zbudowania wpisu wystarcza `fetchJson`
   * i string z adresem.
   */
  it('nie siega po nic z features — queryFn to zapytanie do /api', () => {
    expect(
      registry,
      'import z @/features wciagnalby graf danych sekcji do bundla sidebara, ktory jest na kazdej stronie',
    ).not.toMatch(/from\s+['"]@\/features/)
    expect(registry).not.toMatch(/import\(\s*['"]@\/features/)

    const routes = [...registry.matchAll(/'(\/[a-z-]+)':\s*\{/g)].map((m) => m[1])
    for (const route of routes) {
      expect(
        registry,
        `${route} nie pobiera danych przez route handler — patrz navigation-perf.test.ts`,
      ).toMatch(new RegExp(`fetchJson\\('/api${route}'\\)`))
    }
  })

  it('klucz i staleTime bierze z tego samego zrodla co hooki sekcji', () => {
    // Rozjazd tutaj = prefetch wypelnia inny wpis cache niz ten, ktorego uzyje
    // strona docelowa, i zaplacimy zapytanie dwa razy.
    expect(registry).toMatch(/QUERY_KEYS\./)
    expect(registry).toMatch(/QUERY_CONFIG\.\w+\.staleTime/)
    expect(
      registry,
      'staleTime wpisany liczba rozjedzie sie z QUERY_CONFIG przy pierwszej zmianie profilu',
    ).not.toMatch(/staleTime:\s*\d/)
  })
})

describe('prefetch — podpiecie w nawigacji', () => {
  it('sidebar reaguje na hover i fokus', () => {
    expect(sidebar, 'sidebar to jedyna nawigacja na PC — bez tego desktop nie prefetchuje wcale')
      .toMatch(/usePrefetchRoute/)
    expect(sidebar).toMatch(/onMouseEnter=\{onHoverIntent\(item\.href\)\}/)
    expect(sidebar).toMatch(/onFocus=\{onFocusIntent\(item\.href\)\}/)
  })

  it('dolny pasek uzywa tego samego mechanizmu', () => {
    expect(bottomNav).toMatch(/usePrefetchRoute/)
    expect(bottomNav).toMatch(/onMouseEnter=\{onHoverIntent\(href\)\}/)
  })

  it('istnieje jedna sciezka prefetchu, nie dwie', () => {
    const all = [sidebar, bottomNav, registry].join('\n')
    expect(all, 'usePrefetchDashboard zostal zastapiony przez usePrefetchRoute')
      .not.toMatch(/usePrefetchDashboard/)
  })

  it('hover ma opoznienie, fokus nie', () => {
    const hook = read('hooks/prefetch/usePrefetchRoute.ts')
    expect(hook, 'bez opoznienia przejazd myszka przez sidebar kolejkuje zapytanie za kazda sekcja')
      .toMatch(/setTimeout/)
    expect(hook, 'timer musi byc sprzatany przy odmontowaniu').toMatch(/clearTimeout/)

    // onFocusIntent nie moze przejsc przez setTimeout — dojscie Tabem do linku
    // jest jednoznaczne i czekanie tylko opoznia zapytanie.
    const onFocus = hook.slice(hook.indexOf('const onFocusIntent'))
    expect(onFocus).not.toMatch(/setTimeout/)
  })

  it('kazdy link z prefetchem kasuje zamiar przy opuszczeniu', () => {
    for (const [name, src] of [['sidebar', sidebar], ['bottomNav', bottomNav]] as const) {
      expect(src, `${name}: bez onMouseLeave timer dojrzewa po zjechaniu z linku`)
        .toMatch(/onMouseLeave=\{cancelIntent\}/)
      expect(src, `${name}: bez onBlur to samo dzieje sie po wyjsciu fokusu`)
        .toMatch(/onBlur=\{cancelIntent\}/)
    }
  })
})
