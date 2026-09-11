import { describe, expect, it } from 'vitest'

import {
  AUTOMATION,
  AUTOMATION_STACKED,
  STAGE_GAP,
} from '@/app/[locale]/(marketing)/_landing/motion/automation-timeline'
import { layerFadeKeyframes } from '@/app/[locale]/(marketing)/_landing/motion/scene'
import type { ProgressWindow } from '@/app/[locale]/(marketing)/_landing/motion/tokens'

/**
 * Sekcja automatu opowiada TRZY etapy na jednym torze przewijania:
 * zasady → obecnosc → wypelniajacy sie kalendarz.
 *
 * Wszystko, co moze sie w niej cicho zepsuc, jest arytmetyka okien, a nie
 * stylem:
 *
 *   1. dwa naglowki widoczne naraz (okna nasuniete na siebie),
 *   2. pusty kadr miedzy etapami (okna rozjechane za daleko),
 *   3. kalendarz wypelniajacy sie, zanim w ogole wjedzie na ekran,
 *   4. wynik miesiaca pokazany, zanim siatka skonczy sie wypelniac.
 *
 * Kazdej z tych czterech rzeczy nie widac w kodzie — widac je w polowie
 * przewijania, na zywej stronie. Dlatego stoi tu test.
 */

const TRACK = Array.from({ length: 401 }, (_, index) => index / 400)

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

/** Jasnosc warstwy o podanym oknie w punkcie `at`. */
const litAt = (window: ProgressWindow, at: number) => {
  const { fade } = layerFadeKeyframes(...window)
  return sample(fade.stops, fade.values, at)
}

const VISIBLE = 0.02

describe('automat — okna etapow', () => {
  it('trzyma kazde okno wewnatrz toru i w dobrej kolejnosci', () => {
    for (const [name, [start, end]] of Object.entries(AUTOMATION)) {
      expect(start, `${name}: start`).toBeGreaterThanOrEqual(0)
      expect(end, `${name}: end`).toBeLessThanOrEqual(1)
      expect(end, `${name}: start < end`).toBeGreaterThan(start)
    }
  })

  it('rozdziela warstwy lezace na sobie o cala dlugosc przejscia', () => {
    // Ponizej `2 · LAYER_FADE` wygaszanie poprzednika zachodzi na zapalanie
    // nastepnika — i sekcja pokazuje dwa naglowki naraz.
    for (const [[, earlierEnd], [laterStart]] of AUTOMATION_STACKED) {
      expect(laterStart - earlierEnd).toBeGreaterThanOrEqual(STAGE_GAP - 1e-9)
    }
  })

  it('nie pokazuje dwoch naglowkow etapu na zadnym punkcie toru', () => {
    const copies = [AUTOMATION.rulesCopy, AUTOMATION.presenceCopy, AUTOMATION.resultCopy]

    for (const at of TRACK) {
      const lit = copies.filter((window) => litAt(window, at) > VISIBLE)
      expect(lit.length, `postep ${at}`).toBeLessThanOrEqual(1)
    }
  })

  it('nie pokazuje zasad i kalendarza naraz', () => {
    for (const at of TRACK) {
      const rules = litAt(AUTOMATION.rulesLayer, at)
      const calendar = litAt(AUTOMATION.calendarLayer, at)
      expect(Math.min(rules, calendar), `postep ${at}`).toBeLessThanOrEqual(VISIBLE)
    }
  })

  it('zaczyna i konczy sekcje pelnym kadrem, bez gaszenia na krawedziach toru', () => {
    // Pierwszy etap stoi od przyklejenia sceny, ostatni zostaje do jej
    // zwolnienia — inaczej uzytkownik wjezdza w sekcje na pustym ekranie.
    expect(litAt(AUTOMATION.rulesCopy, 0)).toBe(1)
    expect(litAt(AUTOMATION.rulesLayer, 0)).toBe(1)
    expect(litAt(AUTOMATION.resultCopy, 1)).toBe(1)
    expect(litAt(AUTOMATION.calendarLayer, 1)).toBe(1)
  })

  it('zostawia miedzy etapami oddech, ale krotszy niz dziesiata czesc toru', () => {
    // Przerwa jest celowa (to ona daje takt), ale dluga pustka czyta sie jak
    // zaciecie strony, a nie jak zmiana mysli.
    const dark = TRACK.filter(
      (at) =>
        litAt(AUTOMATION.rulesLayer, at) <= VISIBLE &&
        litAt(AUTOMATION.calendarLayer, at) <= VISIBLE,
    )

    expect(dark.length).toBeGreaterThan(0)
    expect(dark.length / TRACK.length).toBeLessThan(0.1)
  })
})

describe('automat — kalendarz wypelnia sie wtedy, gdy jest na ekranie', () => {
  it('zaczyna wypelnianie dopiero po pelnym wejsciu kalendarza', () => {
    expect(AUTOMATION.fill[0]).toBeGreaterThan(AUTOMATION.calendarLayer[0])
  })

  it('konczy wypelnianie przed koncem toru kalendarza', () => {
    expect(AUTOMATION.fill[1]).toBeLessThanOrEqual(AUTOMATION.calendarLayer[1])
  })

  it('pokazuje wynik miesiaca dopiero po ostatnim wpisanym dniu', () => {
    // Suma pokazana nad wypelniajaca sie siatka klamie: mowi „194 h" w chwili,
    // gdy w kalendarzu stoi polowa z tego.
    expect(AUTOMATION.result[0]).toBeGreaterThanOrEqual(AUTOMATION.fill[1])
  })

  it('daje wypelnianiu wiecej niz trzecia czesc toru sekcji', () => {
    // Trzydziesci dni musi wpasc do siatki na tyle wolno, zeby bylo widac, ze
    // wpadaja PO KOLEI — inaczej kalendarz po prostu pojawia sie gotowy.
    expect(AUTOMATION.fill[1] - AUTOMATION.fill[0]).toBeGreaterThan(1 / 3)
  })
})

describe('automat — os obecnosci wchodzi w srodku pierwszej warstwy', () => {
  it('miesci sie w oknie warstwy zasad', () => {
    expect(AUTOMATION.presenceReveal[0]).toBeGreaterThanOrEqual(AUTOMATION.rulesLayer[0])
    expect(AUTOMATION.presenceReveal[1]).toBeLessThanOrEqual(AUTOMATION.rulesLayer[1])
  })

  it('rusza, zanim padnie nazywajacy ja naglowek', () => {
    // Ruch w kadrze jest tym, co kaze oku wrocic do tresci; zdanie nazywa
    // dopiero to, co wlasnie sie pojawilo.
    expect(AUTOMATION.presenceReveal[0]).toBeLessThan(AUTOMATION.presenceCopy[0])
  })
})
