/**
 * Jezyk ruchu landingu — nazwane wartosci zamiast liczb rozsianych po scenach.
 *
 * Strona ma PIEC rodzajow ruchu i ani jednego wiecej:
 *
 *  1. `camera`   — zblizenie kadru (`scale`), gdy scena chce, zeby oko poszlo
 *                  w konkretne miejsce interfejsu,
 *  2. `scene`    — poziome wejscie ekranu na poprzedni (`ProductJourney`),
 *  3. `reveal`   — pionowe wejscie tresci z wygaszeniem (narracja, liczby,
 *                  etapy automatu),
 *  4. `fade`     — sama zmiana jasnosci (podswietlenia, wynik),
 *  5. `drift`    — bardzo delikatne odsuniecie (hero copy).
 *
 * Kazdy z nich jezdzi na jednej z DWOCH krzywych ponizej. Nie ma tu trzeciej
 * i nie powinno byc: kilkanascie easingow na jednej stronie czyta sie jak
 * kilkanascie roznych produktow.
 *
 * ── Dlaczego krzywa jest FUNKCJA, a nie stringiem `ease` ──
 *
 * Motion oddaje animacje przegladarce tylko wtedy, gdy dostaje pare TABLIC
 * (patrz `./scene`). Krzywej nie da sie wiec podac jako `ease` — probkujemy ja
 * w klatkach, a o plynnosci decyduje GESTOSC probkowania, bo miedzy klatkami
 * kompozytor interpoluje liniowo. Odpowiednik dla przejsc CSS (telefon) stoi w
 * `landing.css` jako `--lp-ease-glide`.
 */

/** C¹: zerowa predkosc na obu koncach. Ruch ZDECYDOWANY — tekst, podswietlenia. */
export const MOTION_CURVE_DECISIVE = (t: number) => t * t * (3 - 2 * t)

/**
 * C²: na obu koncach zeruje sie takze PRZYSPIESZENIE. Ruch PLYNNY — wszystko,
 * co graniczy z bezruchem i przesuwa sie przez ekran (ekrany scen, kamera).
 */
export const MOTION_CURVE_GLIDE = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/**
 * Gestosc probkowania krzywej plynnej.
 *
 * Ruch ekranu graniczy z odcinkami, na ktorych ekran STOI, wiec licza sie
 * konce: przy rzadkim probkowaniu zostaje z nich kopniecie. 24 odcinki scinaja
 * najwiekszy skok predkosci z 833 do 199 procent szerokosci na jednostke
 * postepu — ponizej progu, na ktorym oko lapie zmiane tempa.
 *
 * Klatki sa darmowe: caly tor idzie do WAAPI raz, jako `KeyframeEffect`.
 */
export const MOTION_STEPS_GLIDE = 24

/**
 * Gestosc probkowania krzywej zdecydowanej.
 *
 * Tu gesciej byc NIE MOZE, i to nie ze wzgledu na koszt: plaskie konce
 * trzymaja `opacity` ponizej progu widocznosci dluzej, wiec przerwa miedzy
 * akapitami rosnie z 3 do 9 procent toru — tekst gasnie na zauwazalna chwile.
 */
export const MOTION_STEPS_DECISIVE = 4

/**
 * Gestosc probkowania kamery.
 *
 * Kamera przesuwa `scale` o dwa-trzy procent, wiec osiem odcinkow daje krok
 * ponizej 0,004 — mniej, niz wynosi bledy zaokraglenia rasteryzacji. Gesciej
 * nie byloby czego zobaczyc.
 */
export const MOTION_STEPS_CAMERA = 8

/** Przesuniecie pionowe narracji sceny na wejsciu i na wyjsciu (px). */
export const MOTION_SHIFT_COPY = 14

/** Przesuniecie pionowe warstwy pelnoekranowej (kolosalna liczba, etap automatu). */
export const MOTION_SHIFT_LAYER = 40

/** Klatki jednej krzywej: punkty na torze i wartosci w tych punktach. */
export interface Keyframes<T> {
  stops: number[]
  values: T[]
}

/** Zakres postepu `<start, end>`, oba konce w ulamku toru sekcji. */
export type ProgressWindow = readonly [number, number]

/**
 * Klatki jednego przejscia: `steps` rownych odcinkow na torze, `curve` w
 * wartosciach.
 */
export function ramp<T>(
  [start, end]: ProgressWindow,
  at: (t: number) => T,
  curve: (t: number) => number,
  steps: number,
): Keyframes<T> {
  const stops: number[] = []
  const values: T[] = []

  for (let step = 0; step <= steps; step++) {
    const position = step / steps
    stops.push(start + (end - start) * position)
    values.push(at(curve(position)))
  }

  return { stops, values }
}

/**
 * Domyka tor klatkami na 0 i 1, scalajac punkty, ktore wypadly w tym samym
 * miejscu.
 *
 * Domkniecie nie jest kosmetyczne: kiedy Motion odda wartosc przegladarce
 * (`ScrollTimeline` + Web Animations API), lista klatek staje sie zwyklym
 * `KeyframeEffect`, a WAAPI DOPISUJE klatke neutralna o wartosci wyjsciowej
 * elementu, jesli skrajna nie stoi na offsecie 0 albo 1. Warstwa wracalaby
 * wtedy do stanu poczatkowego dokladnie wtedy, gdy uzytkownik na nia patrzy.
 */
export function closeTrack<T>(stops: number[], values: T[]): Keyframes<T> {
  const outStops: number[] = []
  const outValues: T[] = []

  stops.forEach((stop, index) => {
    if (outStops.length > 0 && stop <= outStops[outStops.length - 1]) {
      outValues[outValues.length - 1] = values[index]
      return
    }
    outStops.push(stop)
    outValues.push(values[index])
  })

  return { stops: outStops, values: outValues }
}

/** Zaokraglenie bez `toFixed` — klatki maja byc stabilnymi stringami. */
export const round = (value: number, places: number) => {
  const unit = 10 ** places
  return Math.round(value * unit) / unit
}
