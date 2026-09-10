import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { APP_LOCALES } from '@/i18n/config'

import marketingDe from '@/messages/de/marketing.json'
import marketingEn from '@/messages/en/marketing.json'
import marketingPl from '@/messages/pl/marketing.json'

import {
  CAPABILITY_KEYS,
  capabilityStep,
  capabilityWindow,
  capabilityWindows,
} from '@/app/[locale]/(marketing)/_landing/motion/capability'
import {
  DEMO_INVOICES,
  DEMO_MONTHLY_HOURS,
} from '@/app/[locale]/(marketing)/_landing/demo/demo-data'

/**
 * Sekcja „mozliwosci" — piec kart na jednym postepie przewijania.
 *
 * Ten plik pilnuje rzeczy, ktorych nie widac na zrzucie ekranu i ktore da sie
 * cofnac jedna linijka: ksztaltu timeline'u, tego, ze zaden jego punkt nie
 * chowa karty, oraz granic wydajnosciowych opisanych w
 * `docs/landing-motion.md`. Wartosci liczbowe timeline'u pochodza z pomiaru w
 * przegladarce — komentarz przy `ENTER` w `motion/capability.ts` mowi, z jakiego.
 */

const ROOT = path.resolve(__dirname, '../..')
const LANDING = 'app/[locale]/(marketing)/_landing'
const SECTION = `${LANDING}/sections/capabilities`

const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(path.join(ROOT, dir))) {
    const relative = path.join(dir, entry)
    if (statSync(path.join(ROOT, relative)).isDirectory()) found.push(...sourceFiles(relative))
    else if (/\.tsx?$/.test(entry)) found.push(relative)
  }
  return found
}

const sectionFiles = sourceFiles(SECTION)
const landingFiles = sourceFiles(LANDING)
const section = read(`${SECTION}/CapabilityCards.tsx`)
const css = read('app/[locale]/(marketing)/landing.css')

describe('capabilities — piec kart w stalej kolejnosci', () => {
  it('ma dokladnie piec kart', () => {
    expect(CAPABILITY_KEYS).toHaveLength(5)
    expect(capabilityWindows('desktop')).toHaveLength(5)
    expect(capabilityWindows('mobile')).toHaveLength(5)
  })

  it('trzyma kolejnosc opowiesci: tracker → kalendarz → faktury → raporty → wymiana', () => {
    // Kolejnosc kluczy to kolejnosc taktow. Przestawienie ich bez przeliczenia
    // okien dalo by karte animowana poza polem widzenia.
    expect([...CAPABILITY_KEYS]).toEqual([
      'tracker',
      'calendar',
      'invoices',
      'reports',
      'integrations',
    ])
  })

  it('renderuje karty w tej samej kolejnosci, w ktorej stoja w timeline', () => {
    const rendered = [...section.matchAll(/<(\w+)Card\b/g)]
      .map((match) => match[1].toLowerCase())
      .filter((name) => name !== 'capability')

    expect(rendered).toEqual(['tracker', 'calendar', 'invoices', 'reports', 'integrations'])
  })

  it('daje kazdej karcie wlasne okno w obu profilach', () => {
    for (const key of CAPABILITY_KEYS) {
      for (const profile of ['desktop', 'mobile'] as const) {
        const [start, end] = capabilityWindow(key, profile)
        expect(start, `${profile}/${key}`).toBeGreaterThanOrEqual(0)
        expect(end, `${profile}/${key}`).toBeGreaterThan(start)
        expect(end, `${profile}/${key}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('otwiera okna kart w kolejnosci ich pozycji w ukladzie', () => {
    for (const profile of ['desktop', 'mobile'] as const) {
      const starts = capabilityWindows(profile).map(([start]) => start)
      const sorted = [...starts].sort((a, b) => a - b)
      expect(starts, profile).toEqual(sorted)
    }
  })

  it('na telefonie daje piec ROZLACZNYCH taktow, na desktopie dwa wiersze', () => {
    // Telefon ma jedna kolumne, wiec kazda karta ma wlasna glebokosc i wlasny
    // takt. Desktop uklada je w dwa wiersze — karty jednego wiersza dziela
    // glebokosc, wiec ich okna MUSZA zachodzic na siebie. Gdyby ktos rozsunal
    // je „dla efektu", ostatnia karta wiersza animowalaby sie po tym, jak
    // uzytkownik dawno na nia patrzy.
    const mobile = capabilityWindows('mobile')
    for (let index = 1; index < mobile.length; index += 1) {
      expect(mobile[index][0], `takt ${index}`).toBeGreaterThanOrEqual(mobile[index - 1][1])
    }

    const desktop = capabilityWindows('desktop')
    const rowOne = desktop.slice(0, 2)
    const rowTwo = desktop.slice(2)
    expect(rowOne[1][0]).toBeLessThan(rowOne[0][1])
    expect(rowTwo[2][0]).toBeLessThan(rowTwo[0][1])
    // Wiersze zostaja rozdzielone: drugi zaczyna sie po pierwszym.
    expect(rowTwo[0][0]).toBeGreaterThan(rowOne[1][0])
  })
})

describe('capabilities — kroki wewnetrzne miesza sie w torze', () => {
  it('nie wychodzi poza <0, 1> i rosnie', () => {
    // Klatki animacji sterowanej scrollem ida do Web Animations API, ktore
    // odrzuca offsety spoza <0, 1> („Offsets must be monotonically
    // non-decreasing"). Liczba krokow bierze sie z danych demo, wiec dopisanie
    // faktury albo miesiaca musi tu zapalic lampke.
    const counts = [1, DEMO_INVOICES.length, DEMO_MONTHLY_HOURS.length, 5, 6]

    for (const key of CAPABILITY_KEYS) {
      for (const profile of ['desktop', 'mobile'] as const) {
        for (const count of counts) {
          for (let index = 0; index < count; index += 1) {
            const [start, end] = capabilityStep(capabilityWindow(key, profile), index, count)
            const label = `${profile}/${key} krok ${index}/${count}`
            expect(start, label).toBeGreaterThanOrEqual(0)
            expect(end, label).toBeLessThanOrEqual(1)
            expect(end, label).toBeGreaterThan(start)
          }
        }
      }
    }
  })

  it('spoznia tresc za ramka karty i zachowuje kolejnosc krokow', () => {
    const window = capabilityWindow('calendar', 'desktop')
    const first = capabilityStep(window, 0, 5)
    const last = capabilityStep(window, 4, 5)

    expect(first[0]).toBeGreaterThan(window[0])
    expect(last[0]).toBeGreaterThan(first[0])
    // Kroki maja na siebie zachodzic — stagger ma byc ciagly, nie klikany.
    expect(last[0]).toBeLessThan(first[1] + (last[1] - last[0]))
  })

  it('daje pojedynczemu krokowi cale pasmo', () => {
    const window = capabilityWindow('tracker', 'desktop')
    const only = capabilityStep(window, 0, 1)
    expect(only[1] - only[0]).toBeGreaterThan((window[1] - window[0]) * 0.9)
  })

  it('liczba krokow zgadza sie z danymi, ktore je karmia', () => {
    // Karty wolaja hooki JAWNIE, po jednym na krok (hooki nie moga siedziec w
    // petli). Dopisanie pozycji do danych demo bez dopisania wywolania
    // zostawiloby ostatni wiersz bez animacji — a tego nie widac w typach.
    expect(DEMO_INVOICES).toHaveLength(3)
    expect(read(`${SECTION}/cards/InvoicesCard.tsx`).match(/capabilityStep\(/g)).toHaveLength(3)

    expect(DEMO_MONTHLY_HOURS).toHaveLength(6)
    expect(read(`${SECTION}/cards/ReportsCard.tsx`).match(/capabilityStep\(/g)).toHaveLength(6)

    const chips = read(`${SECTION}/cards/IntegrationsCard.tsx`)
    expect(chips.match(/capabilityStep\(/g)).toHaveLength(
      chips.match(/const CHIP_KEYS = \[([^\]]*)\]/)![1].split(',').filter(Boolean).length,
    )
  })
})

describe('capabilities — scroll nie chowa zadnej karty', () => {
  it('nigdy nie schodzi do zera: najciemniejsza klatka to wartosc wejsciowa', () => {
    // Przezroczystosc wejsciowa karty jest CELOWO wieksza od zera — dzieki
    // temu zadna klatka toru, takze przed hydratacja i przy wylaczonym
    // JavaScripcie, nie jest niewidoczna. Sam ruch przy `prefers-reduced-motion`
    // zeruje `landing.css`.
    const source = read(`${LANDING}/motion/capability.ts`)
    const enter = Number(source.match(/enterOpacity:\s*([\d.]+)/)![1])
    const settled = Number(source.match(/settledOpacity:\s*([\d.]+)/)![1])

    expect(enter).toBeGreaterThanOrEqual(0.25)
    expect(settled).toBeGreaterThanOrEqual(0.75)
  })

  it('domyka tor po obu stronach okna', () => {
    // Bez klatek na 0 i 1 przegladarka dopisuje wlasne, NEUTRALNE klatki o
    // wartosci wyjsciowej elementu — i karta po swoim takcie wracala do
    // przezroczystosci wejsciowej. Zmierzone w Chromium: „Faktury" schodzily
    // z 0,99 przy p = 0,80 do 0,30 przy p = 1,00.
    const source = read(`${LANDING}/motion/capability.ts`)
    expect(source).toContain('function holdOutside')
    for (const builder of [
      'capabilityCardKeyframes',
      'capabilityStepKeyframes',
      'capabilityBarKeyframes',
    ]) {
      const body = source.slice(source.indexOf(`export function ${builder}`))
      expect(body.slice(0, body.indexOf('\n}')), builder).toContain('holdOutside(')
    }
  })

  it('kazdy element sterowany scrollem ma zaczep `lp-motion`', () => {
    // `lp-motion` to JEDYNY mechanizm ograniczania ruchu w landingu: pod
    // `@media (prefers-reduced-motion: reduce)` dostaje `opacity: 1
    // !important` i `transform: none !important`. Element bez tej klasy
    // zostalby przy `prefers-reduced-motion` niewidoczny.
    const offenders: string[] = []
    for (const file of sectionFiles) {
      for (const element of read(file).matchAll(/<m\.\w+([\s\S]*?)>/g)) {
        if (!/lp-motion/.test(element[1])) offenders.push(file)
      }
    }
    expect([...new Set(offenders)], `brak lp-motion:\n${offenders.join('\n')}`).toEqual([])
  })

  it('CSS przywraca karty i gasi ruch, ktorego nie prowadzi Motion', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/\.lp \.lp-motion \{[^}]*opacity: 1 !important/)
    // Mikroskala hovera i pulsowanie kropki nie ida z Motion, wiec regula
    // `lp-motion` ich nie dosiega — musza miec wlasne wylaczniki.
    expect(reduced).toMatch(/\.lp \.lp-capability \{[^}]*transform: none !important/)
    expect(reduced).toMatch(/\.lp \.lp-cap-dot-live \{ animation: none !important; \}/)
  })
})

describe('capabilities — telefon dostaje lzejszy profil', () => {
  it('animuje tresc kart wylacznie na desktopie i bez ograniczenia ruchu', () => {
    // Na telefonie scroll prowadzi tylko RAMKI kart (piec wartosci na sekcje).
    // Zagniezdzona animacja pod palcem na ekranie 390 px nie dodaje
    // informacji, a mnozy zapisy stylu w klatce przewijania.
    expect(section).toMatch(/const reveal = profile === 'desktop' && !reduceMotion/)
  })

  it('kazda karta ma wariant statyczny obok wariantu sterowanego scrollem', () => {
    // Wariant wybiera sie KOMPONENTEM, nie warunkiem wewnatrz hooka: liczba
    // hookow nie moze zalezec od profilu.
    for (const file of sourceFiles(`${SECTION}/cards`)) {
      expect(read(file), file).toMatch(/\{reveal \?/)
    }
  })

  it('nie tworzy dziesiatek wartosci na elementach listy', () => {
    // Kalendarz zapala sie WIERSZAMI (piec wartosci), a nie dniami (35).
    const calendar = read(`${SECTION}/cards/CalendarCard.tsx`)
    expect(calendar).toContain('const HEAT_WEEKS = 5')
    expect(calendar.match(/capabilityStep\(/g)).toHaveLength(5)
  })
})

describe('capabilities — nie animujemy ukladu', () => {
  it('slupki raportu rosna transformem, nie wysokoscia', () => {
    // Stara implementacja bento animowala `height: 0 → 84%`, czyli kazala
    // przegladarce przeliczac uklad w kazdej klatce przewijania.
    const reports = read(`${SECTION}/cards/ReportsCard.tsx`)
    const motion = read(`${LANDING}/motion/capability.ts`)

    expect(motion).toMatch(/'scaleY\(0\)'/)
    expect(motion).toMatch(/'scaleY\(1\)'/)
    expect(css).toMatch(/\.lp \.lp-cap-bar \{[^}]*transform-origin: bottom/)
    // Docelowa wysokosc jest stala i jedzie zmienna CSS, ustawiana raz.
    expect(css).toMatch(/\.lp \.lp-cap-bar \{[^}]*height: var\(--lp-bar/)
    expect(reports).toContain("['--lp-bar']")
    expect(reports, 'wysokosc slupka nie moze jechac na scrollu').not.toMatch(
      /style=\{\{[^}]*\bheight\s*:/,
    )
  })

  it('nie wstawia do sekcji szerokosci wiekszej niz ekran telefonu', () => {
    // Zrodlo poziomego przewijania na landingu to zawsze sztywna szerokosc w
    // srodku sekcji. Zmierzone: 390x844, 393x852, 430x932, 1280x720 i
    // 1440x900 — `scrollWidth` nigdy nie przekracza `clientWidth`.
    const offenders: string[] = []
    for (const file of sectionFiles) {
      // `max-w-` jest SUFITEM, nie podloga — nie moze wypchnac ukladu poza
      // ekran, wiec lookbehind celowo wypuszcza tylko `w-` i `min-w-`.
      for (const width of read(file).matchAll(/(?<![\w-])(?:min-)?w-\[(\d+)px\]/g)) {
        if (Number(width[1]) > 360) offenders.push(`${file} → ${width[0]}`)
      }
    }
    expect(offenders, `sztywna szerokosc w sekcji:\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('capabilities — jeden silnik animacji, zero listenerow scrolla', () => {
  it('nie zaklada wlasnych listenerow przewijania', () => {
    const offenders = landingFiles.filter((file) =>
      /addEventListener\(\s*['"]scroll['"]/.test(read(file)),
    )
    expect(offenders, `postep idzie z useScroll:\n${offenders.join('\n')}`).toEqual([])
  })

  it('nie dokłada GSAP, Lenis ani drugiego silnika ruchu', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    const installed = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    const banned = ['gsap', 'lenis', '@studio-freight/lenis', 'locomotive-scroll', 'motion']

    expect(installed.filter((name) => banned.includes(name))).toEqual([])
    expect(installed).toContain('framer-motion')
  })

  it('importuje Motion wylacznie jako `framer-motion`', () => {
    // `motion/react` to ta sama biblioteka, ale jeden przeskok przez
    // re-eksport wystarcza, zeby chunk `LazyMotion` przestal byc leniwy —
    // zmierzone +45 kB gzip na tej trasie (`docs/landing-motion.md`).
    const offenders = sectionFiles.filter((file) => /from '(motion|motion\/react)'/.test(read(file)))
    expect(offenders, `uzyj 'framer-motion':\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('capabilities — copy istnieje w kazdym jezyku', () => {
  const CAST = {
    pl: marketingPl.capabilities,
    de: marketingDe.capabilities,
    en: marketingEn.capabilities,
  }

  it.each(APP_LOCALES)('%s ma naglowek i komplet piatki kart', (locale) => {
    const capabilities = CAST[locale]

    expect(capabilities.eyebrow.length).toBeGreaterThan(0)
    expect(capabilities.heading.length).toBeGreaterThan(0)
    expect(Object.keys(capabilities.cards).sort()).toEqual([...CAPABILITY_KEYS].sort())
  })

  it.each(APP_LOCALES)('%s nazywa kazda karte i kazdy chip', (locale) => {
    const cards: Record<string, Record<string, unknown>> = CAST[locale].cards

    for (const key of CAPABILITY_KEYS) {
      for (const field of ['label', 'title', 'body']) {
        expect(String(cards[key][field] ?? ''), `${locale}.${key}.${field}`).not.toHaveLength(0)
      }
    }

    const chipKeys = read(`${SECTION}/cards/IntegrationsCard.tsx`)
      .match(/const CHIP_KEYS = \[([^\]]*)\]/)![1]
      .match(/'([^']+)'/g)!
      .map((chip) => chip.slice(1, -1))

    expect(Object.keys(CAST[locale].cards.integrations.chips).sort()).toEqual([...chipKeys].sort())
  })

  it('nie trzyma copy w komponentach sekcji', () => {
    // Ta sama zasada, co w reszcie landingu: jeden komponent, trzy jezyki.
    // Komentarze zostaja po polsku celowo — audyt dotyczy tekstu dla uzytkownika.
    const stripComments = (source: string) =>
      source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

    const offenders = sectionFiles.filter((file) =>
      /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(stripComments(read(file))),
    )
    expect(offenders, `copy ma isc z messages/:\n${offenders.join('\n')}`).toEqual([])
  })
})
