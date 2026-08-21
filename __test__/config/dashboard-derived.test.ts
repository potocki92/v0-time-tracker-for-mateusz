import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.tsx?$/.test(entry)) acc.push(relative(ROOT, full))
  }
  return acc
}

const SECTIONS = walk(resolve(ROOT, 'features/dashboard/components/sections')).filter(
  (f) => /\/[A-Z]\w*Section\.tsx$/.test(f),
)

describe('dashboard — jedno zrodlo wyliczen', () => {
  it('znajduje sekcje, ktore ma pilnowac', () => {
    expect(SECTIONS.length, 'test stracil cel — sprawdz sciezki').toBeGreaterThanOrEqual(10)
  })

  it('zadna sekcja nie liczy pochodnych na wlasna reke', () => {
    const BANNED = /useFilteredEntries|useRealizedEntries|useDashboardTotals|usePeriodLabel/
    const offenders = SECTIONS.filter((f) => BANNED.test(read(f)))
    expect(
      offenders,
      `wlasny useMemo w sekcji nie wspoldzieli cache — ten sam filtr O(N) leci raz na sekcje.\nUzyj useDashboardDerived():\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('tylko provider subskrybuje caly obiekt danych', () => {
    const offenders = SECTIONS.filter((f) => /useDashboardData\s*\(/.test(read(f)))
    expect(
      offenders,
      `caly DashboardData budzi wszystkie sekcje przy kazdej zmianie.\nUzyj useDashboardSlice(selector):\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('provider liczy pochodne w jednym useMemo', () => {
    const provider = read(
      'features/dashboard/components/sections/shared/DashboardDerivedContext.tsx',
    )
    expect(provider.match(/useMemo\(/g) ?? []).toHaveLength(1)
    expect(provider, 'todayIso musi byc w deps, inaczej memo przezyje polnoc')
      .toMatch(/todayIso,?\s*\]/)
  })

  it('context zakresu zwraca stabilna referencje', () => {
    const filters = read('features/dashboard/hooks/useDashboardFilters.ts')
    expect(filters, 'niestabilny value budzi kazdego konsumenta co render')
      .toMatch(/return useMemo\(/)
    expect(filters, 'setRange tez musi byc stabilny').toMatch(/useCallback\(/)
  })

  it('selektory sa definiowane na poziomie modulu', () => {
    const selectors = read('features/dashboard/hooks/dashboardSelectors.ts')
    expect(selectors).toMatch(/export const selectInvoices/)
    for (const file of SECTIONS) {
      expect(
        read(file),
        `${file}: strzalka inline w useDashboardSlice wymusza ponowne przeliczenie selektu`,
      ).not.toMatch(/useDashboardSlice\(\s*\(/)
    }
  })
})
