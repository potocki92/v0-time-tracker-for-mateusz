import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { AUTOMATION } from '@/app/[locale]/(marketing)/_landing/motion/automation-timeline'
import {
  cameraKeyframes,
  LAYER_FADE,
  layerFadeKeyframes,
  revealKeyframes,
  sceneKeyframes,
  storyWindows,
  type CameraFrame,
} from '@/app/[locale]/(marketing)/_landing/motion/scene'

/**
 * Timeline scen 01-05 (`ProductJourney`) przejechany punkt po punkcie.
 *
 * `motion.test.ts` pilnuje ZASAD (co wolno animowac, gdzie stoi wysokosc
 * toru). Ten plik pilnuje EFEKTU, czyli dwoch rzeczy, ktore ta sekcja
 * obiecuje i ktore latwo cicho zepsuc:
 *
 *   1. ramka aplikacji nie jest PUSTA na zadnym punkcie toru,
 *   2. i nie pokazuje na nim DWOCH ekranow naraz.
 *
 * Testujemy klatki, a nie `useTransform`: wartosc policzona przez Motion
 * aktualizuje sie dopiero w petli klatek, wiec w tescie nigdy nie jest tym,
 * co przed chwila ustawiono.
 */

const ROOT = path.resolve(__dirname, '../..')
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')

const COUNT = 5
const LAYERS = Array.from({ length: COUNT }, (_, index) => sceneKeyframes(index, COUNT))

/** Tak samo, jak interpoluje `useTransform`: liniowo, z zacisnietymi koncami. */
function sample(stops: number[], values: number[], at: number): number {
  if (at <= stops[0]) return values[0]
  const last = stops.length - 1
  if (at >= stops[last]) return values[last]
  const next = stops.findIndex((stop) => stop > at)
  const span = stops[next] - stops[next - 1]
  const ratio = span === 0 ? 0 : (at - stops[next - 1]) / span
  return values[next - 1] + (values[next] - values[next - 1]) * ratio
}

const percent = (value: string) => Number(value.slice('translateX('.length, -2))
const pixels = (value: string) => Number(value.slice('translateY('.length, -3))

/** Pozycja ekranu sceny, w procentach szerokosci ramki. */
const screenAt = (index: number, at: number) =>
  sample(LAYERS[index].screen.stops, LAYERS[index].screen.values.map(percent), at)

const copyAt = (index: number, at: number) =>
  sample(LAYERS[index].copyFade.stops, LAYERS[index].copyFade.values, at)

const spotlightAt = (index: number, at: number) =>
  sample(LAYERS[index].spotlight.stops, LAYERS[index].spotlight.values, at)

const visibleAt = (index: number, at: number) =>
  at >= LAYERS[index].visible[0] && at <= LAYERS[index].visible[1]

/** 401 punktow na torze plus zapas poza nim (bounce Safari). */
const TRACK = Array.from({ length: 401 }, (_, index) => index / 400)
const BEYOND = [-0.4, -0.2, -0.05, 1.05, 1.2, 1.4]

/**
 * Ile procent szerokosci ramki zakrywa SUMA malowanych ekranow. Ekran o
 * pozycji `x` zakrywa pas od `x` do `x + 100`, przyciety do ramki `<0, 100>`;
 * pasy sa nieprzezroczyste, wiec liczy sie ich suma mnogosciowa.
 */
function covered(at: number): number {
  const bands = LAYERS.map((_, index) => index)
    .filter((index) => visibleAt(index, at))
    .map((index) => [
      Math.max(0, screenAt(index, at)),
      Math.min(100, screenAt(index, at) + 100),
    ])
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0])

  let filled = 0
  let edge = 0
  for (const [from, to] of bands) {
    if (to <= edge) continue
    filled += to - Math.max(from, edge)
    edge = to
  }
  return filled
}

describe('sceny 01-05 — ramka nigdy nie jest pusta', () => {
  it('ma na kazdym punkcie toru ekran przykrywajacy cala szerokosc', () => {
    // Poprzednia mechanika (rozdzielone okna `useLayerFade`) zostawiala tu
    // punkt, w ktorym OBIE warstwy mialy `opacity` 0 — pusta ramke aplikacji
    // w srodku najwazniejszej sekcji strony.
    for (const at of [...TRACK, ...BEYOND]) {
      expect(covered(at), `postep ${at}`).toBeCloseTo(100, 6)
    }
  })

  it('nie zostawia ekranu w polowie drogi na koncach toru', () => {
    expect(screenAt(0, 0)).toBe(0)
    expect(screenAt(4, 1)).toBe(0)
  })

  it('trzyma poza ekranem kazda scene, ktorej takt jeszcze nie przyszedl', () => {
    for (let index = 1; index < COUNT; index++) {
      expect(screenAt(index, 0), `scena ${index}`).toBeGreaterThanOrEqual(100)
    }
  })
})

describe('sceny 01-05 — zero klatek z dwoma ekranami naraz', () => {
  it('nie animuje jasnosci ekranu ani przez chwile', () => {
    // Ekran przenikajacy przez ekran to kalka dwoch interfejsow. Widocznosc
    // rozstrzyga wylacznie pozycja: albo ekran zakrywa ramke, albo go nie ma.
    const journey = read('app/[locale]/(marketing)/_landing/sections/ProductJourney.tsx')
    expect(LAYERS.every((layer) => layer.screen.values.every((v) => v.startsWith('translateX'))))
      .toBe(true)
    expect(journey).toMatch(/opacity: 1,\n\s*transform: layers\[index\]\.screen\.transform/)
  })

  it('nigdy nie trzyma w malowaniu trzech ekranow', () => {
    for (const at of TRACK) {
      const painted = LAYERS.filter((_, index) => visibleAt(index, at)).length
      expect(painted, `postep ${at}`).toBeLessThanOrEqual(2)
      expect(painted, `postep ${at}`).toBeGreaterThanOrEqual(1)
    }
  })

  it('nie chowa ekranu, ktory jeszcze cos zakrywa', () => {
    for (const at of [...TRACK, ...BEYOND]) {
      for (let index = 0; index < COUNT; index++) {
        const above = index + 1 < COUNT ? screenAt(index + 1, at) : 100
        // Nastepny ekran nie dojechal jeszcze do lewej krawedzi, wiec ten
        // spod niego nadal widac.
        if (above > 0 && screenAt(index, at) < 100) {
          expect(visibleAt(index, at), `scena ${index} @ ${at}`).toBe(true)
        }
      }
    }
  })
})

describe('sceny 01-05 — ekran nie szarpie', () => {
  /**
   * Predkosci na kolejnych odcinkach krzywej ekranu, w procentach szerokosci
   * ramki na jednostke postepu.
   *
   * Motion oddaje krzywa przegladarce jako pare TABLIC, wiec miedzy klatkami
   * kompozytor interpoluje LINIOWO: predkosc jest stala w obrebie odcinka i
   * zmienia sie skokowo na kazdym zalamaniu. To te skoki widac jako szarpanie,
   * a nie ksztalt krzywej, ktora probkujemy — i dlatego mierzymy wlasnie je.
   */
  function speeds(index: number): number[] {
    const { stops, values } = LAYERS[index].screen
    const out: number[] = []

    for (let step = 1; step < stops.length; step++) {
      const travel = percent(values[step]) - percent(values[step - 1])
      out.push(Math.abs(travel / (stops[step] - stops[step - 1])))
    }

    return out
  }

  it('nie zmienia tempa skokowo w srodku przejscia', () => {
    // Poprzednia wersja probkowala `smoothstep` w pieciu punktach: predkosc
    // szla 0 → 694 → 1528 → 694 → 0, czyli najwiekszy skok siegal 55 procent
    // predkosci szczytowej. Przy 24 odcinkach `smootherstep` schodzi do 13.
    for (let index = 0; index < COUNT; index++) {
      const speed = speeds(index)
      const peak = Math.max(...speed)
      const jump = Math.max(...speed.slice(1).map((value, step) => Math.abs(value - speed[step])))

      expect(jump / peak, `scena ${index}`).toBeLessThan(0.2)
    }
  })

  it('rusza z postoju i dochodzi do postoju, zamiast strzelac', () => {
    // Ekran stoi przez wiekszosc taktu sceny, wiec KAZDE przejscie zaczyna sie
    // i konczy na granicy z bezruchem. Tam skok predkosci boli najbardziej:
    // oko porownuje go z zerem, nie z ruchem obok.
    for (let index = 0; index < COUNT; index++) {
      const speed = speeds(index)
      const peak = Math.max(...speed)

      for (let step = 1; step < speed.length; step++) {
        const fromRest = speed[step - 1] === 0 && speed[step] > 0
        const toRest = speed[step - 1] > 0 && speed[step] === 0
        if (!fromRest && !toRest) continue

        expect(Math.max(speed[step - 1], speed[step]) / peak, `scena ${index} @ ${step}`)
          .toBeLessThan(0.05)
      }
    }
  })

  it('zostawia w ruchu wiecej niz trzecia czesc toru', () => {
    // Sekcja ma sie czytac jak jeden ruch, a nie jak seria zaciec: gdy scena
    // parkuje na dluzej, niz trwa dojscie do niej, przewijanie przestaje
    // odpowiadac i uzytkownik sprawdza, czy strona sie nie zawiesila.
    const moving = TRACK.filter((at) =>
      LAYERS.some((_, index) => {
        const before = screenAt(index, Math.max(0, at - 0.0025))
        return Math.abs(screenAt(index, at) - before) > 1e-9
      }),
    )

    expect(moving.length / TRACK.length).toBeGreaterThan(0.4)
  })
})

describe('sceny 01-05 — jedna krzywa czytana w dwie strony', () => {
  it('prowadzi kazdy ekran monotonicznie z prawej w lewo', () => {
    // Monotonicznosc jest powodem, dla ktorego przewijanie w gore i w dol to
    // ten sam ruch: nie ma osobnej krzywej wejscia i wyjscia do zestrojenia.
    for (let index = 0; index < COUNT; index++) {
      for (let step = 1; step < TRACK.length; step++) {
        expect(screenAt(index, TRACK[step])).toBeLessThanOrEqual(
          screenAt(index, TRACK[step - 1]) + 1e-9,
        )
      }
    }
  })

  it('oddaje ekran po rowno — kazda scena w swojej piatej czesci toru', () => {
    for (let index = 0; index < COUNT; index++) {
      const middle = (index + 0.5) / COUNT
      expect(screenAt(index, middle), `scena ${index}`).toBe(0)
      if (index + 1 < COUNT) expect(screenAt(index + 1, middle), `scena ${index}`).toBe(100)
    }
  })
})

describe('sceny 01-05 — tekst nie przenika przez tekst', () => {
  it('nie pokazuje dwoch akapitow naraz na zadnym punkcie toru', () => {
    for (const at of [...TRACK, ...BEYOND]) {
      const lit = LAYERS.filter((_, index) => copyAt(index, at) > 0.02)
      expect(lit.length, `postep ${at}`).toBeLessThanOrEqual(1)
    }
  })

  it('zostawia miedzy akapitami przerwe, ale krotsza niz przejscie ekranu', () => {
    const dark = TRACK.filter((at) => LAYERS.every((_, index) => copyAt(index, at) < 0.02))
    expect(dark.length, 'tekst gasnie i zapala sie w obrebie jednego przejscia').toBeGreaterThan(0)
    expect(dark.length / TRACK.length).toBeLessThan(0.05)
  })

  it('trzyma narracje zapalona przez caly takt sceny', () => {
    for (let index = 0; index < COUNT; index++) {
      expect(copyAt(index, (index + 0.5) / COUNT), `scena ${index}`).toBe(1)
    }
  })

  it('rusza akapitem tylko w pionie', () => {
    for (const layer of LAYERS) {
      for (const value of layer.copyMove.values) {
        expect(value).toMatch(/^translateY\(-?\d+(\.\d+)?px\)$/)
      }
      expect(Math.abs(pixels(layer.copyMove.values[0]))).toBeLessThanOrEqual(14)
    }
  })
})

describe('sceny 01-05 — podswietlenie nawigacji idzie osobna krzywa', () => {
  it('zapala dokladnie jedna sekcje w srodku kazdej sceny', () => {
    for (let index = 0; index < COUNT; index++) {
      const middle = (index + 0.5) / COUNT
      const lit = LAYERS.map((_, other) => spotlightAt(other, middle))
      expect(lit[index], `scena ${index}`).toBe(1)
      expect(lit.filter((value) => value > 0)).toHaveLength(1)
    }
  })

  it('nie zostawia zapalonych sekcji, przez ktore scroll juz przejechal', () => {
    // Gdyby podswietlenie szlo pozycja ekranu, sidebar zapalalby sie
    // narastajaco — na koncu toru swiecilaby cala nawigacja.
    for (const at of TRACK) {
      const sum = LAYERS.reduce((total, _, index) => total + spotlightAt(index, at), 0)
      expect(sum, `postep ${at}`).toBeCloseTo(1, 6)
    }
  })
})

describe('sceny 01-05 — klatki, ktore przegladarka potrafi interpolowac', () => {
  const curves = LAYERS.flatMap((layer) => [
    layer.screen,
    layer.copyFade,
    layer.copyMove,
    layer.spotlight,
  ])

  it('domyka kazdy tor klatkami na 0 i 1', () => {
    // Bez tego WAAPI dopisuje klatke neutralna o wartosci wyjsciowej elementu
    // i warstwa wraca do stanu poczatkowego po ostatnim keyframie.
    for (const curve of curves) {
      expect(curve.stops[0]).toBe(0)
      expect(curve.stops[curve.stops.length - 1]).toBe(1)
    }
  })

  it('trzyma zakresy wejsciowe scisle rosnace', () => {
    for (const curve of curves) {
      for (let step = 1; step < curve.stops.length; step++) {
        expect(curve.stops[step]).toBeGreaterThan(curve.stops[step - 1])
      }
    }
  })

  it('daje kazdej klatce transformu identyczna strukture', () => {
    // Rozna struktura = przegladarka nie ma czego interpolowac i animacja
    // spada z kompozytora na main thread.
    for (const layer of LAYERS) {
      for (const value of layer.screen.values) {
        expect(value).toMatch(/^translateX\(-?\d+(\.\d+)?%\)$/)
      }
    }
  })
})

describe('automat — wypelniony miesiac zostaje wypelniony', () => {
  /**
   * Okna wpisow w `MonthGrid` przy `fillRange` sekcji automatu — liczone z
   * PRAWDZIWEGO zakresu, a nie przepisane z reki. Wczesniej stala tu kopia
   * trzech par liczb; po przestrojeniu sekcji test nadal przechodzil, tylko
   * sprawdzal juz okna, ktorych nie ma na stronie.
   *
   * `CELL_SPAN` jest prywatny dla `MonthGrid` — powtarzamy go tutaj, bo test
   * ma pilnowac WYNIKU (pierwszy, srodkowy i ostatni wpis), a nie wewnetrznej
   * arytmetyki siatki.
   */
  const CELL_SPAN = 0.16
  const entryWindow = (order: number): [number, number] => {
    const [lo, hi] = AUTOMATION.fill
    const start = lo + order * Math.max(0, hi - lo - CELL_SPAN)
    return [start, start + CELL_SPAN]
  }
  const windows: [number, number][] = [entryWindow(0), entryWindow(0.5), entryWindow(1)]

  it('domyka kazda krzywa wpisu klatkami na 0 i 1', () => {
    // Bez tego Motion podaje WAAPI `offset: [0.16, 0.32]`, przegladarka
    // dopisuje klatki neutralne z wartosci wyjsciowej elementu (`opacity: 0`,
    // `scale(0.86)`) — i kazdy dopisany dzien gasnie przez reszte toru.
    // Kalendarz wypelnial sie na oczach uzytkownika i zaraz pustoszal.
    for (const window of windows) {
      for (const curve of [revealKeyframes(window, 0, 1), revealKeyframes(window, 'a', 'b')]) {
        expect(curve.stops[0], `okno ${window}`).toBe(0)
        expect(curve.stops[curve.stops.length - 1], `okno ${window}`).toBe(1)
      }
    }
  })

  it('trzyma wpis na docelowej wartosci az do konca toru', () => {
    for (const window of windows) {
      const curve = revealKeyframes(window, 0, 1)
      for (const at of TRACK.filter((point) => point >= window[1])) {
        expect(sample(curve.stops, curve.values, at), `okno ${window} @ ${at}`).toBe(1)
      }
    }
  })

  it('nie pokazuje wpisu, zanim automat do niego dojdzie', () => {
    for (const window of windows) {
      const curve = revealKeyframes(window, 0, 1)
      for (const at of TRACK.filter((point) => point <= window[0])) {
        expect(sample(curve.stops, curve.values, at), `okno ${window} @ ${at}`).toBe(0)
      }
    }
  })

  it('scala klatki, gdy okno dotyka konca toru', () => {
    // `useTransform` wymaga zakresu SCISLE rosnacego — zdublowany 0 albo 1
    // wywrocilby interpolacje.
    for (const window of [[0, 0.5], [0.5, 1], [0, 1]] as [number, number][]) {
      const curve = revealKeyframes(window, 0, 1)
      for (let step = 1; step < curve.stops.length; step++) {
        expect(curve.stops[step], `okno ${window}`).toBeGreaterThan(curve.stops[step - 1])
      }
      expect(sample(curve.stops, curve.values, window[0])).toBe(0)
      expect(sample(curve.stops, curve.values, 1)).toBe(1)
    }
  })

  it('nie zostawia w sekcji automatu ani jednego surowego okna', () => {
    // Regresja wraca jedna linijka: `useTransform(progress, window, [0, 1])`.
    for (const file of [
      'app/[locale]/(marketing)/_landing/product/MonthGrid.tsx',
      'app/[locale]/(marketing)/_landing/sections/AutomationShowcase.tsx',
      'app/[locale]/(marketing)/_landing/sections/automation/AutomationCalendar.tsx',
      'app/[locale]/(marketing)/_landing/sections/NumbersStory.tsx',
    ]) {
      for (const call of read(file).matchAll(/use(?:Scroll)?Transform\(\s*progress,\s*([^,]+),/g)) {
        expect(call[1].trim(), `${file}: ${call[0]}`).toMatch(/\.stops$/)
      }
    }
  })
})

describe('sceny 01-05 — prefers-reduced-motion wylacza caly ruch', () => {
  const css = read('app/[locale]/(marketing)/landing.css')
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))

  it('odblokowuje warstwy scen i oba przelaczniki mobilne', () => {
    expect(reduced).toMatch(/\.lp \.lp-layer \{[^}]*opacity: 1 !important/)
    expect(reduced).toMatch(/\.lp \.lp-layer \{[^}]*visibility: visible !important/)
    expect(reduced).toMatch(
      /\.lp \.lp-scene-switch,\s*\n\s*\.lp \.lp-scene-slide \{[^}]*transition: none !important/,
    )
  })

  it('odblokowuje elementy, ktorych ruch idzie wprost ze scrolla', () => {
    expect(reduced).toMatch(/\.lp \.lp-motion \{[^}]*opacity: 1 !important/)
    expect(reduced).toMatch(/\.lp \.lp-motion \{[^}]*transform: none !important/)
  })
})

describe('sceny 01-05 — telefon robi to samo, tylko innym silnikiem', () => {
  const css = read('app/[locale]/(marketing)/landing.css')
  const journey = read('app/[locale]/(marketing)/_landing/sections/ProductJourney.tsx')

  it('stawia aktywna scene na wierzchu z-indeksem, a nie kolejnoscia w DOM', () => {
    // Warstwy montuja sie rosnaco po indeksie, wiec przy powrocie „wstecz"
    // schodzaca scena lezalaby wyzej i przykrywalaby wchodzaca.
    expect(css).toMatch(/\.lp \.lp-scene-slide \{\s*\n?[^}]*z-index: 0|z-index: 0/)
    expect(css).toMatch(/\.lp \.lp-scene-slide\[data-active='true'\]/)
    expect(css).toMatch(/z-index: 1/)
  })

  it('wjezdza ekranem zamiast go przenikac', () => {
    expect(css).toMatch(/\.lp \.lp-scene-slide[^{]*\{[^}]*transform: translateX\(-18%\)/)
    expect(css).toContain('@starting-style')
    expect(css).toMatch(/\.lp-scene-slide\[data-active='true'\] \{\s*transform: translateX\(100%\)/)
  })

  it('zna kierunek przewijania, wiec powrot nie udaje wejscia w przod', () => {
    expect(journey).toMatch(/const back = previous > active/)
    expect(journey.match(/data-back=\{back\}/g) ?? []).toHaveLength(2)
    expect(css).toMatch(/\.lp-scene-slide\[data-active='true'\]\[data-back='true'\]/)
  })

  it('przycina ekrany na kontenerze warstw, a nie na elemencie z paddingiem', () => {
    // Warstwa musi miec DOKLADNIE rozmiar swojego pola przyciecia — inaczej
    // `translateX(100%)` zostawia w ramce pasek nastepnego ekranu.
    expect(journey.match(/lp-screens lp-layers h-full overflow-clip/g) ?? []).toHaveLength(2)
  })

  it('daje ekranowi tlo powierzchni, na ktorej lezy', () => {
    // Bez nieprzezroczystego tla wjezdzajacy ekran nie PRZYKRYWA poprzedniego,
    // tylko przez niego przeswituje — i wracaja dwa interfejsy naraz.
    expect(journey.match(/lp-layer[^"\n]*bg-\[var\(--lp-s1\)\]/g) ?? []).toHaveLength(1)
    expect(journey.match(/lp-scene-slide[^"\n]*bg-\[var\(--lp-s1\)\]/g) ?? []).toHaveLength(1)
  })
})

describe('sceny 01-05 — kamera prowadzi kadr, zamiast go szarpac', () => {
  /**
   * Kadr kamery z `ProductJourney`. Kopia, nie import: test ma pilnowac
   * WLASNOSCI toru (gdzie kamera stoi, jak duzo sie rusza), a nie tego, ze
   * ktos przepisal te sama tablice w dwa miejsca — zmiana kadru sceny jest
   * decyzja projektowa i nie powinna zapalac testu.
   */
  const CAMERA: readonly CameraFrame[] = [
    { scale: 1, lift: 0 },
    { scale: 1.028, lift: -8 },
    { scale: 1, lift: 0 },
    { scale: 1.022, lift: -6 },
    { scale: 1, lift: 0 },
  ]
  const camera = cameraKeyframes(CAMERA)
  const scaleOf = (value: string) => Number(value.slice(value.indexOf('scale(') + 6, -1))
  const scaleAt = (at: number) => sample(camera.stops, camera.values.map(scaleOf), at)

  it('domyka tor klatkami na 0 i 1', () => {
    expect(camera.stops[0]).toBe(0)
    expect(camera.stops[camera.stops.length - 1]).toBe(1)
  })

  it('trzyma zakres wejsciowy scisle rosnacy', () => {
    for (let step = 1; step < camera.stops.length; step++) {
      expect(camera.stops[step]).toBeGreaterThan(camera.stops[step - 1])
    }
  })

  it('daje kazdej klatce transformu identyczna strukture', () => {
    // Rozna struktura = przegladarka nie ma czego interpolowac i animacja
    // spada z kompozytora na main thread.
    for (const value of camera.values) {
      expect(value).toMatch(/^translateY\(-?\d+(\.\d+)?px\) scale\(\d+(\.\d+)?\)$/)
    }
  })

  it('stoi na zadanym kadrze przez caly takt kazdej sceny', () => {
    // Kamera ma byc rezyseria, a nie ciaglym dryfem: rusza sie wylacznie
    // wtedy, gdy zmienia sie ekran.
    for (let index = 0; index < CAMERA.length; index++) {
      expect(scaleAt((index + 0.5) / CAMERA.length), `scena ${index}`).toBeCloseTo(
        CAMERA[index].scale,
        6,
      )
    }
  })

  it('nie zbliza sie na tyle, zeby replika wyszla poza scene', () => {
    // Powyzej kilku procent osmiopikselowa czcionka w srodku widocznie traci
    // ostrosc — kadr skaluje sie jako warstwa rastrowa, nie jako tekst.
    for (const value of camera.values) {
      expect(scaleOf(value)).toBeLessThanOrEqual(1.05)
      expect(scaleOf(value)).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('sekwencja pelnoekranowa — kazda wartosc ma swoj takt', () => {
  const COUNT = 5
  const windows = storyWindows(COUNT)

  it('dzieli tor po rowno miedzy wszystkie kroki', () => {
    expect(windows).toHaveLength(COUNT)
    const spans = windows.map(([start, end]) => end - start)
    for (const span of spans) expect(span).toBeCloseTo(spans[0], 6)
  })

  it('nie pokazuje dwoch wartosci naraz na zadnym punkcie toru', () => {
    const lit = (window: readonly [number, number], at: number) => {
      const { fade } = layerFadeKeyframes(window[0], window[1])
      return sample(fade.stops, fade.values, at)
    }

    for (const at of [...TRACK, ...BEYOND]) {
      expect(windows.filter((window) => lit(window, at) > 0.02).length, `postep ${at}`)
        .toBeLessThanOrEqual(1)
    }
  })

  it('zaczyna pelnym obrazem i konczy pelnym obrazem', () => {
    // Pierwsza warstwa nie ma wejscia, ostatnia wyjscia — sekcja nie moze
    // zaczynac sie ani konczyc pusta czernia.
    expect(windows[0][0] - LAYER_FADE).toBeCloseTo(0, 6)
    expect(windows[COUNT - 1][1] + LAYER_FADE).toBeCloseTo(1, 6)
  })

  it('przestraja cala sekwencje, gdy dojdzie szosta wartosc', () => {
    // Zero recznie dobranych okien: dopisanie kroku nie wymaga ani jednej
    // nowej liczby w komponencie.
    const six = storyWindows(6)
    expect(six).toHaveLength(6)
    for (let index = 1; index < six.length; index++) {
      expect(six[index][0] - six[index - 1][1]).toBeCloseTo(2 * LAYER_FADE, 6)
    }
  })
})
