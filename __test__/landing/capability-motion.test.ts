import { describe, expect, it } from 'vitest'

import {
  CAPABILITY_KEYS,
  capabilityBarKeyframes,
  capabilityCardKeyframes,
  capabilityStep,
  capabilityStepKeyframes,
  capabilityWindow,
  type Keyframes,
} from '@/app/[locale]/(marketing)/_landing/motion/capability'
import type { MotionProfile } from '@/app/[locale]/(marketing)/_landing/motion/profile'

/**
 * Timeline sekcji „mozliwosci" przejechany punkt po punkcie.
 *
 * `capabilities.test.ts` pilnuje KSZTALTU okien; ten plik pilnuje tego, co z
 * nich naprawde wychodzi. Trzy rzeczy da sie sprawdzic wylacznie przez
 * przejechanie calego toru:
 *
 *  1. Zaden punkt toru nie chowa karty. Osoba, ktora zatrzyma przewijanie
 *     dokladnie pomiedzy kartami, ma zobaczyc obie — nie czarna dziure.
 *  2. Wartosc PO ostatniej klatce zostaje tam, gdzie ma zostac. Bez klatek na
 *     0 i 1 przegladarka dopisuje wlasne, neutralne klatki o wartosci
 *     wyjsciowej elementu — zmierzone w Chromium przed poprawka: karta
 *     „Faktury" schodzila z 0,99 przy p = 0,80 z powrotem do 0,30 przy p = 1,00.
 *  3. Karta nie cofa sie w trakcie wlasnego wejscia — zadnego migotania w
 *     srodku taktu.
 *
 * Sprawdzamy CZYSTE klatki, a nie `MotionValue`: wartosc wyliczona przez
 * `useTransform` aktualizuje sie dopiero w petli klatek przegladarki, wiec w
 * tescie nigdy nie jest tym, co przed chwila ustawiono. Interpolacja liniowa
 * miedzy klatkami to dokladnie to, co robi z nimi Motion i WAAPI.
 */

const PROFILES: MotionProfile[] = ['desktop', 'mobile']

/** 201 punktow toru — gestosc, przy ktorej widac kazde okno i kazda przerwe. */
const TRACK = Array.from({ length: 201 }, (_, index) => index / 200)

/** Ta sama interpolacja, ktora zrobi z tych klatek przegladarka. */
function valueAt(keyframes: Keyframes<number>, point: number): number {
  const { stops, values } = keyframes
  if (point <= stops[0]) return values[0]
  if (point >= stops[stops.length - 1]) return values[values.length - 1]

  const next = stops.findIndex((stop) => stop >= point)
  const span = stops[next] - stops[next - 1]
  const ratio = span === 0 ? 1 : (point - stops[next - 1]) / span

  return values[next - 1] + (values[next] - values[next - 1]) * ratio
}

function assertSaneKeyframes<T>(keyframes: Keyframes<T>, label: string) {
  expect(keyframes.stops.length, label).toBe(keyframes.values.length)
  expect(keyframes.stops[0], `${label}: tor musi zaczynac sie w zerze`).toBe(0)
  expect(keyframes.stops[keyframes.stops.length - 1], `${label}: i konczyc w jedynce`).toBe(1)

  for (let index = 1; index < keyframes.stops.length; index += 1) {
    // WAAPI odrzuca offsety nierosnace („Offsets must be monotonically
    // non-decreasing"), a `useTransform` dzieli przez dlugosc odcinka.
    expect(keyframes.stops[index], `${label}: klatka ${index}`).toBeGreaterThan(
      keyframes.stops[index - 1],
    )
  }
}

describe('klatki karty — tor domkniety po obu stronach', () => {
  it.each(PROFILES)('%s: kazda karta ma klatki na 0 i 1, scisle rosnace', (profile) => {
    for (const key of CAPABILITY_KEYS) {
      const { fade, transform } = capabilityCardKeyframes(key, profile)
      assertSaneKeyframes(fade, `${profile}/${key} opacity`)
      assertSaneKeyframes(transform, `${profile}/${key} transform`)
    }
  })

  it.each(PROFILES)('%s: zadna karta nie gasnie na zadnym punkcie toru', (profile) => {
    for (const key of CAPABILITY_KEYS) {
      const { fade } = capabilityCardKeyframes(key, profile)
      const darkest = TRACK.map((point) => ({ point, value: valueAt(fade, point) })).reduce(
        (worst, sample) => (sample.value < worst.value ? sample : worst),
      )

      expect(darkest.value, `${profile}/${key} przy p=${darkest.point}`).toBeGreaterThanOrEqual(0.3)
    }
  })

  it.each(PROFILES)('%s: karta dochodzi do pelni dokladnie w koncu swojego okna', (profile) => {
    for (const key of CAPABILITY_KEYS) {
      const [, end] = capabilityWindow(key, profile)
      const { fade } = capabilityCardKeyframes(key, profile)

      expect(valueAt(fade, end), `${profile}/${key}`).toBeCloseTo(1, 6)
      expect(Math.max(...TRACK.map((point) => valueAt(fade, point))), `${profile}/${key}`).toBeCloseTo(
        1,
        6,
      )
    }
  })

  it.each(PROFILES)('%s: po takcie karta przygasa i JUZ NIE WRACA', (profile) => {
    for (const key of CAPABILITY_KEYS) {
      const [, end] = capabilityWindow(key, profile)
      const { fade } = capabilityCardKeyframes(key, profile)

      // Po przygasnieciu wartosc jest STALA az do konca toru. Gdyby tor nie
      // byl domkniety, w tym miejscu widac by bylo zjazd do 0,3.
      for (const point of TRACK.filter((value) => value >= end + 0.13)) {
        expect(valueAt(fade, point), `${profile}/${key} przy p=${point}`).toBeCloseTo(0.9, 6)
      }
    }
  })

  it.each(PROFILES)('%s: wejscie karty nie cofa sie w polowie taktu', (profile) => {
    for (const key of CAPABILITY_KEYS) {
      const [start, end] = capabilityWindow(key, profile)
      const { fade } = capabilityCardKeyframes(key, profile)
      const inside = TRACK.filter((point) => point >= start && point <= end)

      for (let index = 1; index < inside.length; index += 1) {
        expect(
          valueAt(fade, inside[index]),
          `${profile}/${key} migotanie przy p=${inside[index]}`,
        ).toBeGreaterThanOrEqual(valueAt(fade, inside[index - 1]) - 1e-9)
      }
    }
  })

  it.each(PROFILES)('%s: transform zaczyna i konczy tor na tych samych stanach', (profile) => {
    for (const key of CAPABILITY_KEYS) {
      const { transform } = capabilityCardKeyframes(key, profile)

      expect(transform.values[0], `${profile}/${key}`).toBe('translateY(22px) scale(0.978)')
      expect(transform.values[transform.values.length - 1], `${profile}/${key}`).toBe(
        'translateY(0px) scale(1)',
      )
      // Kazda klatka ma te same funkcje CSS w tej samej kolejnosci — inaczej
      // przegladarka nie ma czego interpolowac i animacja wraca na main thread.
      for (const value of transform.values) {
        expect(value, `${profile}/${key}`).toMatch(/^translateY\(-?[\d.]+px\) scale\([\d.]+\)$/)
      }
    }
  })
})

describe('klatki tresci karty', () => {
  it('trzyma tresc widoczna do konca toru, zamiast wygaszac ja po oknie', () => {
    const window = capabilityStep(capabilityWindow('invoices', 'desktop'), 0, 3)
    const { fade, transform } = capabilityStepKeyframes(window, 6)

    assertSaneKeyframes(fade, 'krok opacity')
    expect(valueAt(fade, window[1])).toBeCloseTo(1, 6)
    expect(valueAt(fade, 1), 'tresc nie moze wracac do zera').toBeCloseTo(1, 6)
    expect(transform.values[transform.values.length - 1]).toBe('translateY(0px)')
  })

  it('stoi na zerze przez caly odcinek przed swoim oknem', () => {
    const window = capabilityStep(capabilityWindow('integrations', 'desktop'), 4, 5)
    const { fade } = capabilityStepKeyframes(window, 6)

    expect(valueAt(fade, 0)).toBe(0)
    expect(valueAt(fade, window[0])).toBeCloseTo(0, 6)
    expect(valueAt(fade, (window[0] + window[1]) / 2)).toBeCloseTo(0.5, 6)
  })
})

describe('klatki slupka raportu', () => {
  it('rosnie scaleY od podstawy i zostaje w pelnej wysokosci', () => {
    const window = capabilityStep(capabilityWindow('reports', 'desktop'), 0, 6)
    const { fade, transform } = capabilityBarKeyframes(window)

    assertSaneKeyframes(transform, 'slupek transform')
    expect(transform.values[0]).toBe('scaleY(0)')
    expect(transform.values[transform.values.length - 1]).toBe('scaleY(1)')
    // Po oknie slupek ma stac, a nie zapadac sie z powrotem do zera.
    expect(valueAt(fade, 1)).toBeCloseTo(1, 6)
    // Ani jedna klatka nie dotyka wlasciwosci ukladu — sam `scaleY`.
    for (const value of transform.values) expect(value).toMatch(/^scaleY\([\d.]+\)$/)
  })

  it('daje kazdemu slupkowi wlasny, pozniejszy takt', () => {
    const card = capabilityWindow('reports', 'desktop')
    const starts = Array.from({ length: 6 }, (_, index) => capabilityStep(card, index, 6)[0])

    for (let index = 1; index < starts.length; index += 1) {
      expect(starts[index], `slupek ${index}`).toBeGreaterThan(starts[index - 1])
    }
    expect(starts[starts.length - 1]).toBeLessThanOrEqual(1)
  })
})
