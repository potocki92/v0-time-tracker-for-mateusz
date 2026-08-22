import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Kazda sekcja panelu miala wlasna implementacje tych samych elementow: trzy
 * akcje glowne o trzech wysokosciach, trzy kafelki KPI, szesc wartosci
 * `tracking` na jednym wzorcu eyebrow, cztery kontenery strony i dwie kopie
 * tej samej palety. Ten plik pilnuje, ze nie wroci zadna z tych szesciu
 * kategorii — inwentarz stanu sprzed ujednolicenia jest w `docs/ui-audit.md`.
 *
 * Asercje chodza po zrodlach, nie po DOM. Wersje przegladarkowa (policzone
 * style, nie klasy) trzyma `e2e/ui-consistency.spec.ts`.
 */
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

const featureFiles = walk(resolve(ROOT, 'features'))
const sources = new Map(featureFiles.map((f) => [f, read(f)]))

const offenders = (predicate: (source: string) => boolean) =>
  [...sources].filter(([, src]) => predicate(src)).map(([file]) => file)

describe('ui — akcja glowna idzie przez <Button>', () => {
  it('zaden surowy <button> nie maluje sie na emerald', () => {
    // Trzy sekcje mialy trzy rozne przyciski „dodaj": shadcnowy <Button>,
    // recznie sklejony <button> bez wysokosci i <button> z h-8. Akcent nalezy
    // do wariantu `accent`, nie do klasy wklejonej w JSX.
    const found = offenders((src) => /<button[^>]*bg-emerald-500/s.test(src))
    expect(
      found,
      `akcje maluja sie recznie zamiast <Button variant="accent">:\n${found.join('\n')}`,
    ).toEqual([])
  })

  it('buttonVariants zna wariant accent', () => {
    expect(
      read('components/ui/button.tsx'),
      'bez wariantu `accent` sekcje wroca do recznego bg-emerald-500',
    ).toMatch(/accent:\s*'bg-emerald-500 text-black hover:bg-emerald-400'/)
  })
})

describe('ui — jeden kafelek KPI', () => {
  it('features nie deklaruje wlasnych kafelkow sekcji', () => {
    // `EarningsKpi` w karcie Zarobek zostaje swiadomie — to kafelek
    // ZAGNIEZDZONY w karcie, nie kafelek sekcji. Patrz P2 w docs/ui-audit.md.
    const found = offenders((src) => /function (KpiTile|InvoiceStatCard)\b/.test(src))
    expect(
      found,
      `kafelek KPI ma jedna implementacje — components/common/stat/StatTile.tsx:\n${found.join('\n')}`,
    ).toEqual([])
  })
})

describe('ui — jedna paleta', () => {
  it('features nie trzyma wlasnych slownikow tokenow', () => {
    const found = featureFiles.filter((f) => f.endsWith('.tokens.ts'))
    expect(
      found,
      `paleta panelu mieszka w components/ui/tokens.ts — module-boundaries zabrania importu features -> features, wiec kazda kopia tutaj rozjedzie sie z reszta:\n${found.join('\n')}`,
    ).toEqual([])
  })
})

describe('ui — jeden eyebrow', () => {
  it('features nie ustawia trackingu wartoscia arbitralna', () => {
    const found = offenders((src) => /tracking-\[0\.\d+em\]/.test(src))
    expect(
      found,
      `eyebrow idzie przez <SectionEyebrow> albo token LINEAR.eyebrow (0.18em):\n${found.join('\n')}`,
    ).toEqual([])
  })
})

describe('ui — jeden kontener strony', () => {
  const SECTIONS = /^features\/(clients|projects|invoices|reports|calendar)\//
  const shells = featureFiles.filter(
    (f) => SECTIONS.test(f) && /(Content|Skeleton)\.tsx$/.test(f),
  )

  it('znajduje powloki wszystkich pieciu sekcji', () => {
    // Pulpit celowo poza lista — ma wlasna siatke data-dashboard-grid.
    expect(shells.length, 'zmienil sie uklad plikow sekcji').toBeGreaterThanOrEqual(8)
  })

  for (const shell of shells) {
    it(`${shell} uzywa <PageContainer>`, () => {
      expect(sources.get(shell), `${shell} nie renderuje <PageContainer>`).toContain(
        '<PageContainer',
      )
      expect(
        sources.get(shell),
        `${shell} sklada kontener recznie — szerokosc sekcji znowu rozjedzie sie z sasiadami`,
      ).not.toContain('mx-auto w-full max-w-')
    })
  }
})

describe('ui — kanoniczne powierzchnie kart', () => {
  /**
   * Liczymy wylacznie powierzchnie KART: literal z promieniem `rounded-xl`
   * albo `rounded-2xl`, obramowaniem i tlem ze skali `--surface-*`. Pigulki
   * (`rounded-full`), wiersze list (`rounded-md`/`rounded-lg`) i naglowki
   * arkuszy (`rounded-t-2xl`) sa poza licznikiem — nie sa kartami i nie maja
   * dzielic z nimi promienia. Warianty z prefiksem (`hover:`, `active:`,
   * `data-[…]:`) tez odpadaja: to stany, nie powierzchnia spoczynkowa.
   */
  function cardSurfaces(source: string): string[] {
    const found: string[] = []
    for (const match of source.matchAll(/[`"']([^`"'\n]*)[`"']/g)) {
      const tokens = match[1].split(/\s+/).filter((t) => t && !t.includes(':'))
      const radius = tokens.find((t) => /^rounded-(?:xl|2xl)$/.test(t))
      const background = tokens.find((t) => /^bg-surface-\d$/.test(t))
      const borders = tokens.filter((t) => /^border(?:-.+)?$/.test(t))
      if (radius && background && borders.length) {
        found.push([radius, borders.join(' '), background].join(' | '))
      }
    }
    return found
  }

  it('features uzywa najwyzej trzech zestawow', () => {
    const byVariant = new Map<string, string[]>()
    for (const [file, src] of sources) {
      for (const variant of cardSurfaces(src)) {
        byVariant.set(variant, [...(byVariant.get(variant) ?? []), file])
      }
    }
    const report = [...byVariant]
      .map(([variant, files]) => `${variant}  (${[...new Set(files)].join(', ')})`)
      .join('\n')

    // Trzy: karta, karta zagniezdzona, wariant dashed — wszystkie trzy
    // stoja w SURFACE w components/ui/tokens.ts.
    expect(
      byVariant.size,
      `powierzchnie kart znowu rozjezdzaja sie po sekcjach; uzyj SURFACE.card / SURFACE.cardNested / SURFACE.cardDashed:\n${report}`,
    ).toBeLessThanOrEqual(3)
  })

  it('SURFACE wystawia dokladnie te trzy zestawy', () => {
    const tokens = read('components/ui/tokens.ts')
    for (const name of ['card', 'cardNested', 'cardDashed']) {
      expect(tokens, `brak SURFACE.${name}`).toMatch(new RegExp(`\\b${name}:\\s*'`))
    }
  })
})
