import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { sceneKeyframes } from '@/app/[locale]/(marketing)/_landing/motion/scene'

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
