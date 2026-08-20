import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(relative(ROOT, full))
  }
  return acc
}

const APP_PAGES = walk(resolve(ROOT, 'app/(app)')).filter((f) => /page\.tsx$/.test(f))

describe('nawigacja — Router Cache', () => {
  const config = read('next.config.mjs')

  it('deklaruje experimental.staleTimes', () => {
    expect(
      config,
      'bez staleTimes Next 15 nie cache’uje segmentow dynamicznych — kazde wejscie na sekcje to pelny RSC + skeleton',
    ).toMatch(/staleTimes/)
  })

  it('trzyma staleTimes.dynamic powyzej zera', () => {
    const match = config.match(/dynamic:\s*(\d+)/)
    expect(match, 'brak staleTimes.dynamic w next.config.mjs').not.toBeNull()
    expect(
      Number(match![1]),
      'dynamic: 0 = brak cache = objaw wraca',
    ).toBeGreaterThan(0)
  })
})

describe('nawigacja — prefetch nie blokuje streamu RSC', () => {
  it('zaden page.tsx w (app) nie ma await prefetchQuery w default exporcie', () => {
    const offenders = APP_PAGES.filter((f) => {
      const src = read(f)
      if (!/prefetchQuery/.test(src)) return false
      return /export\s+default\s+async\s+function/.test(src)
    })
    expect(
      offenders,
      `async default export + prefetchQuery = caly segment czeka na Supabase zanim cokolwiek poleci do przegladarki.\nPrzenies await do komponentu-dziecka wewnatrz <Suspense>:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('kazda strona z prefetchem ma granice <Suspense>', () => {
    const offenders = APP_PAGES.filter((f) => {
      const src = read(f)
      return /prefetchQuery/.test(src) && !/<Suspense/.test(src)
    })
    expect(
      offenders,
      `prefetch bez granicy Suspense — nie ma czego streamowac:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('kazda strona z prefetchem oddaje dane przez HydrationBoundary', () => {
    const offenders = APP_PAGES.filter((f) => {
      const src = read(f)
      return /prefetchQuery/.test(src) && !/HydrationBoundary/.test(src)
    })
    expect(
      offenders,
      `prefetch bez HydrationBoundary = dane zostaja na serwerze, klient fetchuje drugi raz:\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})

describe('nawigacja — middleware nie robi round-tripu do GoTrue', () => {
  const proxy = read('lib/supabase/proxy.ts')

  it('weryfikuje sesje lokalnie przez getClaims', () => {
    expect(
      proxy,
      'middleware odpala sie na kazdym requescie RSC — getUser() to round-trip sieciowy przy kazdej nawigacji',
    ).toMatch(/getClaims\(\)/)
  })

  it('nie wola getUser() w middleware', () => {
    expect(
      proxy.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''),
      'getUser() w middleware duplikuje to, co layout robi juz przez getServerUser()',
    ).not.toMatch(/auth\.getUser\(\)/)
  })

  it('autoryzacja zostaje w serwerowym layoucie', () => {
    const layout = read('app/(app)/layout.tsx')
    expect(layout).toMatch(/getServerUser\(\)/)
    expect(layout).toMatch(/redirect\('\/auth\/login'\)/)
  })
})
