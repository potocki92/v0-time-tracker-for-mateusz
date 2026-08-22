import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

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

describe('dashboard — skeleton odwzorowuje tresc', () => {
  it('kontener skeletonu ma te same ograniczenia szerokosci co tresc', () => {
    const contentContainer = classesContaining(content, 'mx-auto w-full')
    const skeletonContainer = classesContaining(skeleton, 'mx-auto w-full')

    for (const token of ['xl:max-w-', 'px-3', 'sm:px-4', 'xl:px-8']) {
      expect(
        skeletonContainer,
        `skeleton nie ma "${token}" — podmiana przesunie strone w poziomie`,
      ).toContain(token)
      expect(contentContainer).toContain(token)
    }
  })

  it('skeleton ma to samo dopelnienie dolne co tresc', () => {
    // pb-28 przy tresci z pb-24 md:pb-10 zmienia wysokosc strony na samej
    // podmianie — pasek przewijania skacze, choc nic sie nie przerysowalo.
    const contentContainer = classesContaining(content, 'mx-auto w-full')
    const skeletonContainer = classesContaining(skeleton, 'mx-auto w-full')
    for (const token of ['pb-24', 'md:pb-10']) {
      expect(skeletonContainer).toContain(token)
      expect(contentContainer).toContain(token)
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

  it('skeleton odwzorowuje siatke tresci', () => {
    expect(skeleton).toMatch(/grid-cols-1[^"]*lg:grid-cols-12/)
    expect(skeleton, 'brak pasa KPI').toMatch(/lg:col-span-4/)
    expect(skeleton, 'brak podzialu na kolumne i szyne').toMatch(/xl:col-span-8/)
  })

  it('pas KPI ma w skeletonie tyle samo komorek co w tresci', () => {
    const inContent = (content.match(/lg:col-span-4/g) ?? []).length
    const inSkeleton = (skeleton.match(/lg:col-span-4/g) ?? []).length
    expect(
      inSkeleton,
      'brakujaca albo nadmiarowa karta KPI to caly jej wiersz przesuniecia',
    ).toBe(inContent)
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
    const shell = codeOf(read('app/(app)/_layout/AppShell.tsx'))
    expect(shell, 'WorkspaceHeader musi byc renderowany raz, w powloce').toContain(
      '<WorkspaceHeader',
    )
    expect(
      shell.indexOf('<WorkspaceHeader'),
      'naglowek ma stac PRZED <main>, inaczej wpada w granice ladowania strony',
    ).toBeLessThan(shell.indexOf('<main'))
  })

  it('HeaderSkeleton odwzorowuje caly HeroGreeting', () => {
    // dateline + naglowek + akapit `sm:hidden` + zakladki zakresu = 4 bloczki.
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
