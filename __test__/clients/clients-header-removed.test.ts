import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Sekcja Klienci miala wlasny przyklejony pasek (tytul + licznik + wyszukiwarka
 * + trzy filtry), dublujacy breadcrumb gornego paska i toolbar tabeli. Pasek
 * zostal usuniety — ten plik pilnuje, ze nie wroci, i ze przy okazji nie zginely
 * dwie rzeczy, ktore w nim mieszkaly: akcja „Dodaj klienta" i naglowek h1.
 */
const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const CLIENTS_DIR = resolve(ROOT, 'features/clients')
const HEADER_FILE = 'features/clients/components/ClientsHeader.tsx'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

const content = read('features/clients/components/ClientsContent.tsx')
const skeleton = read('features/clients/components/ClientsSkeleton.tsx')
const table = read('features/clients/components/ClientsTable.tsx')

describe('clients — pasek sekcji zniknal', () => {
  it('nie ma pliku ClientsHeader.tsx', () => {
    expect(
      existsSync(resolve(ROOT, HEADER_FILE)),
      `${HEADER_FILE} wrocil — sekcja znowu ma drugi pasek pod gornym`,
    ).toBe(false)
  })

  it('nikt w features/clients nie odwoluje sie do ClientsHeader', () => {
    const offenders = sourceFiles(CLIENTS_DIR)
      .filter((file) => readFileSync(file, 'utf8').includes('ClientsHeader'))
      .map((file) => file.slice(ROOT.length + 1))

    expect(
      offenders,
      `martwy import/komentarz o ClientsHeader:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('ani tresc, ani skeleton nie przyklejaja wlasnego paska pod naglowkiem', () => {
    // `sticky top-14` byl obejsciem na stanie POD gornym paskiem (h-14).
    // Gornym paskiem zajmuje sie AppShell — drugi tu to znowu ~120 px tresci.
    for (const [name, src] of [
      ['ClientsContent.tsx', content],
      ['ClientsSkeleton.tsx', skeleton],
    ] as const) {
      expect(src, `${name} znowu rysuje przyklejony pasek sekcji`).not.toContain('sticky top-14')
    }
  })

  it('skeleton nie odwzorowuje juz wyszukiwarki sekcji', () => {
    expect(
      skeleton,
      'skeleton z paskiem, ktorego tresc nie ma — lista skoczy przy podmianie',
    ).not.toContain('Szukaj')
  })
})

describe('clients — co musialo przezyc usuniecie paska', () => {
  it('strona nadal ma h1, tylko dla czytnikow ekranu', () => {
    // Bez h1 na /clients wywalaja sie a11y.spec.ts, workspace-header.spec.ts
    // i screenshots.spec.ts — wszystkie asertuja heading level 1.
    expect(content, 'brak h1 na /clients — trzy suity e2e ida na czerwono').toContain(
      'sr-only">Klienci',
    )
  })

  it('akcja „Dodaj klienta" nadal idzie portalem do gornego paska', () => {
    expect(
      content,
      'bez WorkspaceHeaderActions przycisk „Dodaj klienta" znika z gornego paska',
    ).toContain('WorkspaceHeaderActions')
  })

  it('wyszukiwarka desktopowa zostaje w toolbarze tabeli', () => {
    expect(
      table,
      'searchPlaceholder to jedyne, co po usunieciu paska szuka klientow na desktopie',
    ).toContain('searchPlaceholder')
  })
})
