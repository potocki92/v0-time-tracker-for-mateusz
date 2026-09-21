import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { COLLAPSED_SECTION_ROWS } from '@/features/dashboard/components/DashboardSkeleton'
import { DASHBOARD_SECTIONS } from '@/features/dashboard/sections/registry'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const content = read('features/dashboard/components/DashboardContent.tsx')
const skeleton = read('features/dashboard/components/DashboardSkeleton.tsx')
const sections = read('features/dashboard/components/skeletons/SectionSkeletons.tsx')

/**
 * Zwraca wartosc className, ktora ZAWIERA podany marker.
 *
 * Naiwne "znajdz marker, potem zlap najblizszy className" nie dziala: marker
 * (`mx-auto w-full`) siedzi w SRODKU atrybutu, wiec szukanie `className="` od
 * jego pozycji trafia dopiero w NASTEPNY element i test sprawdza nie ten div.
 */
function classesContaining(src: string, marker: string): string {
  for (const m of src.matchAll(/className="([^"]+)"/g)) {
    if (m[1].includes(marker)) return m[1]
  }
  throw new Error(`nie znaleziono className zawierajacego: ${marker}`)
}

/** Zrodlo bez komentarzy — asercje maja dotyczyc JSX, nie prozy o nim. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

/** Blok kodu jednej funkcji — od jej deklaracji do nastepnego `function`. */
function bodyOf(src: string, name: string): string {
  const start = src.indexOf(`function ${name}`)
  if (start === -1) throw new Error(`nie znaleziono funkcji: ${name}`)
  const rest = src.slice(start + name.length)
  const next = rest.indexOf('\nexport function ')
  return next === -1 ? rest : rest.slice(0, next)
}

/**
 * Klasy dopelnienia i szerokosci kontenera, w kolejnosci zrodlowej.
 *
 * Asercja porownuje LISTY, a nie obecnosc wpisanych tu z palca wartosci:
 * zmiana `px-3` na `px-4` w tresci ma wymusic te sama zmiane w skeletonie,
 * a nie poprawke w tescie.
 */
function geometryOf(classes: string): string[] {
  return classes
    .split(/\s+/)
    .filter((token) => /^(?:[a-z]+:)?(?:p[xytb]?|max-w)-/.test(token))
}

describe('dashboard — skeleton odwzorowuje tresc', () => {
  it('kontener skeletonu ma te sama geometrie co kontener tresci', () => {
    // Rozjazd o jeden stopien dopelnienia przesuwa cala strone w poziomie
    // albo w pionie na samej podmianie skeletonu na tresc.
    const contentContainer = classesContaining(content, 'mx-auto w-full')
    const skeletonContainer = classesContaining(skeleton, 'mx-auto w-full')

    expect(
      geometryOf(skeletonContainer),
      'skeleton i tresc maja inna geometrie kontenera',
    ).toEqual(geometryOf(contentContainer))
  })

  it('kontener niesie komplet klas geometrii', () => {
    // Bezpiecznik na wypadek, gdyby OBA pliki zgubily te same klasy naraz:
    // porownanie list bylo by wtedy zgodne, a strona i tak by sie rozjechala.
    const contentContainer = classesContaining(content, 'mx-auto w-full')
    for (const prefix of ['px-', 'sm:px-', 'xl:px-', 'xl:max-w-', 'pb-', 'md:pb-', 'pt-']) {
      expect(
        geometryOf(contentContainer).some((token) => token.startsWith(prefix)),
        `kontener Pulpitu stracil klase "${prefix}…"`,
      ).toBe(true)
    }
  })

  it('skeleton nie ma wlasnego max-width', () => {
    // Komentarz w pliku OPISUJE stara wartosc jako przyczyne bledu i ma prawo
    // ja wymienic z nazwy — asercja patrzy wiec na sam kod.
    expect(
      codeOf(skeleton),
      'max-w-2xl w skeletonie przy pelnoekranowej tresci = przeskok 672 px → 1440 px',
    ).not.toMatch(/max-w-2xl/)
  })

  it('skeleton odwzorowuje uklad warstwowy tresci', () => {
    // Uklad nie jest juz siatka 12-kolumnowa: hero, pas trzech kart,
    // wiersz „Dostosuj pulpit" i JEDEN panel zwinietych sekcji.
    expect(skeleton, 'brak pasa nad zagieciem').toMatch(/grid-cols-1[^"]*lg:grid-cols-3/)
    expect(skeleton, 'brak karty hero').toContain('<HeroSkeleton')
  })

  it('zwiniete sekcje sa w skeletonie jednym panelem, tak jak w tresci', () => {
    // W tresci wiersze dzieli `divide-y` PANELU, a nie ramka kazdego wiersza.
    // Skeleton z osobnymi kaflami dawalby inna wysokosc i inne krawedzie.
    for (const source of [skeleton, read('features/dashboard/components/dashboard-sections.tsx')]) {
      expect(source, 'panel zwinietych sekcji ma dzielic wiersze wlosem').toContain(
        'divide-y divide-hairline',
      )
      expect(source).toContain('DASHBOARD_SURFACE.card')
    }
  })

  it('karta w skeletonie ma pasek naglowka, bo tresc go ma', () => {
    // `DashboardSectionCard` rysuje naglowek NA karcie — bez jego odpowiednika
    // w skeletonie kazda karta skakalaby o wysokosc tego paska.
    expect(sections, 'skeleton karty bez paska naglowka').toContain('border-b border-hairline')
  })

  it('pas nad zagieciem ma w skeletonie tyle kart, ile rejestr ma primary', () => {
    const primary = DASHBOARD_SECTIONS.filter((s) => s.tier === 'primary').length
    const inSkeleton = (skeleton.match(/<KpiSkeleton/g) ?? []).length
    expect(
      inSkeleton,
      'brakujaca albo nadmiarowa karta KPI to caly jej wiersz przesuniecia',
    ).toBe(primary)
  })

  it('liczba zwinietych wierszy zgadza sie z rejestrem', () => {
    // Skeleton trzyma te liczbe jako stala, zeby nie wciagac rejestru
    // do chunka `loading.tsx` — zgodnosc pilnuje wiec test, nie typ.
    const collapsible = DASHBOARD_SECTIONS.filter(
      (s) => s.tier !== 'hero' && s.tier !== 'primary',
    ).length
    expect(
      COLLAPSED_SECTION_ROWS,
      'kazdy brakujacy wiersz to 44 px przeskoku przy podmianie skeletonu',
    ).toBe(collapsible)
  })

  it('HeaderSkeleton nie rysuje wlasnego paska naglowka', () => {
    // Naglowek obszaru roboczego siedzi w AppShell, czyli PONAD granica
    // <Suspense> dashboardu — jest widoczny przez cale ladowanie. Pasek
    // w skeletonie bylby wiec drugim paskiem, ktorego tresc nie ma, i strona
    // skakalaby o jego wysokosc na podmianie.
    const header = codeOf(bodyOf(sections, 'HeaderSkeleton'))
    expect(
      header,
      'skeleton rysuje pasek, ktorego tresc juz nie ma — naglowek jest w AppShell',
    ).not.toMatch(/sticky top-0/)
  })

  it('naglowek panelu stoi nad granica Suspense, nie w skeletonie', () => {
    // Bez komentarzy: docblock powloki sam pisze o `<main>`.
    const shell = codeOf(read('app/[locale]/(app)/_layout/AppShell.tsx'))
    expect(shell, 'WorkspaceHeader musi byc renderowany raz, w powloce').toContain(
      '<WorkspaceHeader',
    )
    expect(
      shell.indexOf('<WorkspaceHeader'),
      'naglowek ma stac PRZED <main>, inaczej wpada w granice ladowania strony',
    ).toBeLessThan(shell.indexOf('<main'))
  })

  it('HeaderSkeleton odwzorowuje caly HeroGreeting', () => {
    // dateline + naglowek + podtytul + zakladki zakresu = 4 bloczki.
    const blocks = bodyOf(sections, 'HeaderSkeleton').match(/<SkeletonBlock/g) ?? []
    expect(
      blocks.length,
      'kazdy nieodwzorowany element HeroGreeting wskakuje znikad przy podmianie',
    ).toBeGreaterThanOrEqual(4)
  })

  it('bloczki naglowka nie uzywaja wysokosci zaokraglonej w gore', () => {
    // Bloczek 40 px nie odpowiada zadnemu elementowi HeroGreeting — poprzednia
    // wersja skeletonu wychodzila przez to 8 px za wysoka.
    const header = bodyOf(sections, 'HeaderSkeleton')
    expect(header).not.toMatch(/height=\{40\}/)
  })
})

describe('dashboard — brak martwych granic Suspense', () => {
  it('sekcje nie maja wlasnych granic Suspense', () => {
    // Komentarze wyciete: plik TLUMACZY w docblocku, dlaczego tych granic nie
    // ma, i to wyjasnienie ma prawo pisac `<Suspense>`. Liczy sie JSX.
    const count = (codeOf(content).match(/<Suspense/g) ?? []).length
    expect(
      count,
      'DashboardDerivedProvider zawiesza sie wyzej — te granice nie moga sie odpalic niezaleznie',
    ).toBe(0)
  })
})
