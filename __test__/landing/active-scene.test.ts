import { describe, expect, it } from 'vitest'

import {
  SCENE_DEAD_ZONE,
  resolveSceneIndex,
} from '@/app/[locale]/(marketing)/_landing/motion/active-scene'

/**
 * Mobilny `ProductJourney` nie animuje pieciu ekranow — trzyma w DOM ten,
 * na ktory wskazuje scroll. Cala ta decyzja to jedna czysta funkcja, wiec
 * cala da sie sprawdzic bez przegladarki.
 *
 * Testujemy trzy rzeczy, ktore na telefonie widac natychmiast, gdy sie zepsuja:
 * progi, zachowanie na granicy (miganie) i symetrie obu kierunkow.
 */

const SCENES = 5
/** Przewiniecie od zera do jedynki, z zapamietaniem indeksu — jak prawdziwy scroll. */
function sweep(points: readonly number[], from = 0): number[] {
  let current = from
  return points.map((p) => (current = resolveSceneIndex(p, SCENES, current)))
}

describe('active scene — progi', () => {
  it('mapuje postep na scene wedlug rownych piatych toru', () => {
    const points = [0.0, 0.19, 0.21, 0.41, 0.61, 0.81, 1.0]
    expect(sweep(points)).toEqual([0, 0, 1, 2, 3, 4, 4])
  })

  it('trzyma sie skrajnych scen poza zakresem', () => {
    // Safari potrafi oddac ujemny postep (bounce na gorze) i wiekszy od
    // jedynki (bounce na dole) — indeks nie moze z tego wyjsc poza liste.
    expect(resolveSceneIndex(-0.2, SCENES)).toBe(0)
    expect(resolveSceneIndex(-999, SCENES, 3)).toBe(0)
    expect(resolveSceneIndex(1.3, SCENES)).toBe(4)
    expect(resolveSceneIndex(1.3, SCENES, 4)).toBe(4)
  })

  it('zostawia biezaca scene, gdy postep nie jest liczba', () => {
    expect(resolveSceneIndex(Number.NaN, SCENES, 2)).toBe(2)
  })

  it('klamruje bezsensowny indeks wejsciowy', () => {
    expect(resolveSceneIndex(0.5, SCENES, -3)).toBe(2)
    expect(resolveSceneIndex(0.5, SCENES, 99)).toBe(2)
  })
})

describe('active scene — histereza', () => {
  it('nie zmienia sceny wewnatrz martwej strefy wokol progu', () => {
    // Prog miedzy scena 1 a 2 lezy na 0,4. Drganie palca w promieniu
    // martwej strefy nie moze przerzucac ekranu tam i z powrotem.
    const jitter = [0.4, 0.398, 0.402, 0.4, 0.395, 0.405, 0.4]
    expect(new Set(sweep(jitter, 1))).toEqual(new Set([1]))
    expect(new Set(sweep(jitter, 2))).toEqual(new Set([2]))
  })

  it('przepuszcza zmiane dopiero za martwa strefa', () => {
    const past = SCENE_DEAD_ZONE * 1.5
    const inside = SCENE_DEAD_ZONE / 2

    expect(resolveSceneIndex(0.4 + past, SCENES, 1)).toBe(2)
    expect(resolveSceneIndex(0.4 + inside, SCENES, 1)).toBe(1)
    expect(resolveSceneIndex(0.4 - past, SCENES, 2)).toBe(1)
    expect(resolveSceneIndex(0.4 - inside, SCENES, 2)).toBe(2)
  })

  it('zostawia punkty kontrolne poza martwa strefa', () => {
    // Progi sceny leza co 0,2, a punkty kontrolne 0,01 za nimi. Gdyby
    // martwa strefa urosla do 0,01, wynik w tych punktach zaczalby zalezec
    // od bledu zaokraglenia zamiast od zamierzonego zachowania.
    expect(SCENE_DEAD_ZONE).toBeLessThan(0.01)
  })
})

describe('active scene — oba kierunki przewijania', () => {
  it('wraca ta sama droga, ktora przyszlo', () => {
    const down = [0, 0.25, 0.45, 0.65, 0.85, 1]
    const up = [...down].reverse()
    expect(sweep(down)).toEqual([0, 1, 2, 3, 4, 4])
    expect(sweep(up, 4)).toEqual([4, 4, 3, 2, 1, 0])
  })

  it('nie gubi ani nie przeskakuje sceny przy gestym przemiataniu', () => {
    const points = Array.from({ length: 201 }, (_, i) => i / 200)
    const down = sweep(points)
    const up = sweep([...points].reverse(), 4)

    // Monotonicznosc w obie strony: indeks nigdy nie cofa sie w trakcie
    // przewijania w dol ani nie rosnie w trakcie przewijania w gore.
    expect(down.every((v, i) => i === 0 || v >= down[i - 1])).toBe(true)
    expect(up.every((v, i) => i === 0 || v <= up[i - 1])).toBe(true)
    expect(new Set(down)).toEqual(new Set([0, 1, 2, 3, 4]))
    expect(new Set(up)).toEqual(new Set([0, 1, 2, 3, 4]))
  })

  it('przy skoku przez pol toru (szybki flick) laduje na wlasciwej scenie', () => {
    expect(resolveSceneIndex(0.9, SCENES, 0)).toBe(4)
    expect(resolveSceneIndex(0.05, SCENES, 4)).toBe(0)
  })
})
