import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Zasady ruchu landingu, ktorych nie widac na zrzucie ekranu.
 *
 * Kazda z nich powstala z konkretnego pomiaru na telefonie i kazda da sie
 * cicho cofnac jedna linijka w komponencie — dlatego stoi tu test, a nie
 * tylko komentarz.
 */

const ROOT = path.resolve(__dirname, '../..')
const LANDING = 'app/[locale]/(marketing)/_landing'
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

const files = sourceFiles(LANDING)
/**
 * Pliki, ktore naprawde czytaja postep przewijania — tylko ich dotycza te
 * reguly. Wejscie do warstwy ruchu jest jedno: `motion/scene` (zrodla postepu,
 * timeline warstw i sklejanie transformu).
 */
const scrollDriven = files.filter((file) => /from '.*motion\/scene'/.test(read(file)))

describe('landing motion — animujemy tylko to, co potrafi kompozytor', () => {
  it('nie animuje scrollem zadnej wlasciwosci ukladu', () => {
    // `width`, `height`, `top`, `margin` w stylu sterowanym scrollem to
    // przeliczanie ukladu w kazdej klatce. Transform i opacity nie dotykaja
    // ukladu w ogole.
    const forbidden = /style=\{\{[^}]*\b(width|height|top|left|right|bottom|margin|padding)\s*:/s
    const offenders = scrollDriven.filter((file) => forbidden.test(read(file)))
    expect(offenders, `uklad nie moze jechac na scrollu:\n${offenders.join('\n')}`).toEqual([])
  })

  it('podaje transform jako jeden string, nigdy jako skladowe x/y/scale/rotate', () => {
    // Motion akceleruje sprzetowo wylacznie klucze `opacity`, `transform`,
    // `filter`, `clipPath` i `backgroundColor`. Skladowe (`y`, `scale`,
    // `rotateX`) musi najpierw skleic w JS, wiec kazda z nich to zapis stylu
    // w kazdej klatce przewijania. Uzasadnienie w `motion/scene.ts`.
    const offenders: string[] = []
    for (const file of scrollDriven) {
      for (const style of read(file).matchAll(/style=\{\{(.*?)\}\}/gs)) {
        if (/\b(x|y|scale|rotate|rotateX|rotateY|rotateZ)\s*:/.test(style[1])) offenders.push(file)
      }
    }
    expect(
      [...new Set(offenders)],
      `zloz transform w jeden string (useScrollTransform):\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('nie rozsiewa will-change po komponentach', () => {
    // Kazdy `will-change` to osobna warstwa kompozycji. Kilkanascie ich na
    // telefonie kosztuje wiecej, niz oszczedza.
    const offenders = files.filter((file) => /will-?[cC]hange/.test(read(file)))
    expect(offenders, `will-change tylko po pomiarze:\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('landing motion — scroll nie dotyka stanu Reacta', () => {
  it('nie przenosi postepu przewijania do useState', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = read(file)
      // Dozwolone jest `setState` na INDEKS sceny (kilka razy na sekcje).
      // Zakazane — cokolwiek, co wyglada na zapis samego postepu.
      if (/set[A-Za-z]*\((?:progress|scrollY|scrollYProgress|value)\)/.test(source)) {
        offenders.push(file)
      }
    }
    expect(offenders, `postep zostaje w MotionValue:\n${offenders.join('\n')}`).toEqual([])
  })

  it('mierzy szerokosc jednym hookiem, a nie window.innerWidth po komponentach', () => {
    const offenders = files.filter(
      (file) => /window\.(innerWidth|innerHeight)/.test(read(file)) && !file.endsWith('profile.ts'),
    )
    expect(offenders, `uzyj useMotionProfile:\n${offenders.join('\n')}`).toEqual([])
  })

  it('czyta prefers-reduced-motion tak, zeby serwer i klient sie zgadzaly', () => {
    // `useReducedMotion` z Motion czyta media query juz w pierwszym renderze,
    // wiec u osob z ograniczonym ruchem rozjezdzal hydratacje (React #418).
    const offenders = files.filter(
      (file) => /\buseReducedMotion\b/.test(read(file)) && !file.endsWith('profile.ts'),
    )
    expect(
      offenders,
      `uzyj usePrefersReducedMotion z motion/profile:\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})

describe('landing motion — telefon dostaje lzejszy profil', () => {
  const journey = read(`${LANDING}/sections/ProductJourney.tsx`)

  it('ma osobny renderer mobilny i desktopowy', () => {
    expect(journey).toContain('function JourneyDesktop')
    expect(journey).toContain('function JourneyMobile')
    expect(journey).toContain('function JourneyStatic')
  })

  it('na telefonie trzyma w DOM jedna scene, a druga tylko na czas przejscia', () => {
    // Piec zamontowanych replik aplikacji naraz to piec drzew w kompozycji
    // przez cala sekcje — na telefonie sam ich rozmiar zjada budzet klatki.
    expect(journey).toContain('resolveSceneIndex')
    expect(journey).toMatch(/mounted\s*=\s*previous === -1 \? \[active\]/)
  })

  it('trzyma wysokosc toru w CSS, nie w klasie zaleznej od profilu', () => {
    // Profil przelacza sie PO hydratacji. Gdyby od niego zalezala wysokosc
    // toru, desktop przesuwalby cala strone w chwili hydratacji.
    const track = journey.match(/className="(lp-track[^"]*)"/)![1]
    expect(track).toContain('lp-track-journey')
    expect(track, `wysokosc toru w klasie: ${track}`).not.toMatch(/h-\[/)
    expect(read('app/[locale]/(marketing)/landing.css')).toMatch(
      /\.lp-track-journey \{ height: \d+svh; \}/,
    )
  })

  it('mierzy tory przewijania w svh, nie w vh', () => {
    // Na iOS `vh` ignoruje pasek Safari, wiec jego chowanie zmienia postep
    // sceny w srodku ruchu palca.
    const offenders: string[] = []
    for (const file of scrollDriven) {
      for (const track of read(file).matchAll(/lp-track[^"']*/g)) {
        if (/\d+vh/.test(track[0])) offenders.push(`${file} → ${track[0]}`)
      }
    }
    expect(offenders, `tor przewijania w svh:\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('landing motion — MonthGrid nie mnozy wartosci na telefonie', () => {
  const grid = read(`${LANDING}/product/MonthGrid.tsx`)

  it('animuje tygodniami na telefonie, a dniami na desktopie', () => {
    expect(grid).toContain('function WeekReveal')
    expect(grid).toContain('function DayCellReveal')
    expect(grid).toMatch(/byWeek\s*=\s*progress !== undefined && profile === 'mobile'/)
  })

  it('bez postepu nie tworzy ani jednej wartosci sterowanej scrollem', () => {
    // Ekran Kalendarza pokazuje miesiac GOTOWY. Wczesniej przepuszczal stala
    // jedynke przez szescdziesiat `useTransform`, ktore nigdy sie nie zmienialy.
    expect(grid).toMatch(/progress\?:\s*MotionValue<number>/)
    expect(read(`${LANDING}/product/screens/CalendarScreen.tsx`)).not.toContain('useMotionValue')
  })
})

describe('landing — replika aplikacji miesci sie w ramce', () => {
  const css = read('app/[locale]/(marketing)/landing.css')
  const grid = read(`${LANDING}/product/MonthGrid.tsx`)
  const journey = read(`${LANDING}/sections/ProductJourney.tsx`)

  it('nie daje komorce wlasnej wysokosci, gdy o wysokosci decyduje rodzic', () => {
    // `min-height` komorki i `grid-auto-rows: minmax(0, 1fr)` to sprzecznosc:
    // tor wiersza wolno zjechac do zera, ale element w srodku upiera sie przy
    // swojej wysokosci. Gdy rodzic byl nizszy niz 5 x 38 px, kazdy tydzien
    // wychodzil poza swoj tor i NACHODZIL na nastepny.
    expect(grid).toContain('lp-month-fill')
    expect(css).toMatch(/\.lp \.lp-month-fill \.lp-day \{ min-height: 0; \}/)
  })

  it('daje ramce na telefonie proporcje telefonu, nie polowy telefonu', () => {
    // Przy 3/4 ramka miala szerokosc telefonu i polowe jego wysokosci, a w
    // srodku stal uklad zaprojektowany na pelny ekran — ekran Kalendarza nie
    // miescil miesiaca. Zmierzone na 390x844, 393x852 i 430x932: 9/14 to
    // najwyzsza proporcja, ktora nadal miesci sie w scenie.
    const frame = journey.match(/className="(aspect-\[[^"]*)"/)![1]
    expect(frame).toContain('aspect-[9/14]')
    expect(frame, 'desktop zostaje pozioma jak okno aplikacji').toContain('sm:aspect-[4/3]')
  })
})

describe('landing motion — kosztowne efekty tylko tam, gdzie je widac', () => {
  const css = read('app/[locale]/(marketing)/landing.css')

  it('nie wlacza backdrop-filter na przyklejonym pasku telefonu', () => {
    // `backdrop-filter` na elemencie `fixed` kaze rozmyc tlo od nowa w kazdej
    // klatce przewijania — na mobilnym Safari to jeden z najdrozszych efektow.
    expect(read(`${LANDING}/sections/Navbar.tsx`)).toMatch(
      /scrolled && profile === 'desktop' \? 'backdrop-blur-md' : ''/,
    )
  })

  it('trzyma duzy cien ramki wylacznie na desktopie', () => {
    const shadow = css.match(/@media \(min-width: 1024px\) \{\s*\.lp \.lp-device \{ box-shadow:/)
    expect(shadow, 'cien 120 px pod skalowanym elementem to koszt w kazdej klatce').not.toBeNull()
  })

  it('nie zostawia scenie mobilnej pustej klatki miedzy scenami', () => {
    // Nowa scena wchodzi do DOM od razu z `data-active`, wiec bez
    // `@starting-style` nie mialaby od czego animowac i po prostu by wyskoczyla.
    expect(css).toContain('@starting-style')
    expect(css).toMatch(/\.lp-scene-switch\[data-active='true'\]/)
  })
})
