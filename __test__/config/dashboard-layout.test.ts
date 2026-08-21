import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const src = readFileSync(
  resolve(ROOT, 'features/dashboard/components/DashboardContent.tsx'),
  'utf8',
)

describe('dashboard — uklad desktopowy', () => {
  it('uzywa gridu, nie samego stosu pionowego', () => {
    expect(src, 'bez gridu dashboard to 15 kart w jednej kolumnie na 1920 px')
      .toMatch(/data-dashboard-grid/)
    expect(src).toMatch(/grid-cols-1[^"]*lg:grid-cols-12/)
  })

  it('ma pas KPI od lg i podzial na strefy od xl', () => {
    const kpi = src.match(/lg:col-span-4/g) ?? []
    expect(kpi, 'pas KPI to trzy karty po 4/12').toHaveLength(3)
    expect(src, 'kolumna glowna 8/12 od xl').toMatch(/xl:col-span-8/)
    expect(src, 'szyna 4/12 od xl').toMatch(/xl:col-span-4/)
  })

  it('kontener ma max-width', () => {
    expect(
      src,
      'dashboard byl jedyna sekcja bez max-width — linia tekstu rosla do 1400 px',
    ).toMatch(/xl:max-w-\[\d+px\]/)
  })

  it('nie miesza space-y z gap na kontenerze gridu', () => {
    const gridLine = src.split('\n').find((l) => l.includes('data-dashboard-grid'))
    expect(gridLine).toBeDefined()
    expect(
      gridLine,
      'space-y w gridzie sumuje sie z gap i rozjezdza rytm',
    ).not.toMatch(/space-y-/)
  })

  it('komorka gridu wymusza min-w-0', () => {
    expect(
      src,
      'dziecko gridu ma min-width: auto — wykres szerszy od kolumny rozpycha uklad',
    ).toMatch(/function DashboardCell[\s\S]*?'min-w-0'/)
  })

  it('naglowek zostaje poza komorka gridu', () => {
    // HeroGreeting nie jest komorka siatki — wrzucenie go do <DashboardCell>
    // wciagneloby powitanie w pas KPI i przesunelo caly wiersz.
    const beforeGrid = src.split('data-dashboard-grid')[0]
    expect(beforeGrid, 'HeaderSection ma stac przed kontenerem gridu').toContain(
      '<HeaderSection />',
    )
    expect(src).not.toMatch(/<DashboardCell[^>]*>\s*<HeaderSection/)
  })

  it('szyna nie ma self-start i trzyma sticky na dziecku', () => {
    const rail = src.split('data-dashboard-rail')[1]?.slice(0, 600) ?? ''
    expect(
      rail,
      'self-start kurczy komorke do tresci i sticky przestaje dzialac',
    ).not.toMatch(/self-start/)
    expect(rail, 'sticky musi siedziec na dziecku komorki').toMatch(/xl:sticky/)
  })

  it('offset szyny nie wjezdza pod naglowek obszaru roboczego', () => {
    // WorkspaceHeader: h-14 (56 px) + border-b (1) = 57 px, z-30.
    // Ponizej tej wartosci szyna chowa sie za naglowkiem.
    const rail = src.split('data-dashboard-rail')[1] ?? ''
    const top = rail.match(/xl:top-(\d+)/)?.[1]
    expect(top, 'brak xl:top na przyklejonym dziecku szyny').toBeDefined()
    expect(
      Number(top) * 4,
      'offset w px musi przekraczac 57 px wysokosci naglowka',
    ).toBeGreaterThan(57)
  })
})
