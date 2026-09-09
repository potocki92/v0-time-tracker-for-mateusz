'use client'

import type { RefObject } from 'react'
import { transform, useScroll, useTransform, type MotionValue } from 'framer-motion'

/**
 * Motion Landing V2 — trzy funkcje, wszystkie na MotionValue.
 *
 * Zasady, ktore te helpery wymuszaja:
 *  - jedno zrodlo postepu na scene (`useScroll` z targetem), zero wlasnych
 *    listenerow `window.scroll`,
 *  - zaden przelicznik nie dotyka stanu Reacta, wiec przewijanie nie
 *    powoduje rerenderow — animuja sie wylacznie `transform` i `opacity`.
 */

/**
 * Interpolacja wartosci sterowanej scrollem.
 *
 * Rownowazna `useTransform(value, inputRange, outputRange)` z JEDNA roznica:
 * przekazujemy gotowa funkcje zamiast pary tablic, przez co Framer nie moze
 * przepiac wyniku na akceleracje WAAPI (`value.accelerate`, patrz
 * `use-transform.mjs`). Sciezka akcelerowana oddaje klatki natywnej animacji
 * na ViewTimeline i w scenach tej strony liczyla postep wzgledem calego
 * dokumentu zamiast wzgledem toru sceny — pierwsza warstwa nigdy nie gasla,
 * a dwie sceny naraz zostawaly widoczne. Wersja funkcyjna liczy sie w JS,
 * nadal bez ani jednego rerenderu Reacta.
 */
export function useScrollMap<T extends number | string>(
  source: MotionValue<number>,
  inputRange: readonly number[],
  outputRange: readonly T[],
): MotionValue<T> {
  return useTransform(source, transform([...inputRange], [...outputRange]))
}

/** Postep toru przewijania: 0 gdy tor wchodzi pod gorna krawedz, 1 gdy wychodzi. */
export function useTrackProgress(ref: RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  return scrollYProgress
}

/** Postep sekcji przesuwajacej sie przez ekran: 0 na jej gorze, 1 gdy znika w gorze. */
export function useExitProgress(ref: RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  return scrollYProgress
}

/**
 * DOKLADNIE polowa przerwy miedzy oknami scen (0,07), wiec przejscia sa
 * scisle sekwencyjne: scena gasnie do zera w tym samym punkcie, w ktorym
 * nastepna zaczyna sie pojawiac. Zadna para ekranow nie maluje sie naraz.
 *
 * Przy 0,045 zakresy zachodzily na siebie o 0,02 postepu i w tym oknie
 * Kalendarz (opacity 0,11) prosvitywal przez Projekty (0,34) — kalka
 * dwoch interfejsow, ktora widac bylo w kazdym przewinieciu.
 */
const FADE = 0.035

/**
 * Okno widocznosci jednej warstwy sceny. Warstwy leza na sobie w gridzie,
 * wiec przejscie to zmiana `opacity` + kilkanascie pikseli `y` — bez
 * przerysowania ukladu.
 *
 * Klatki NIE MOGA wyjsc poza <0, 1>: przy scroll-linked animacji Framer
 * oddaje je Web Animations API, ktore odrzuca ujemne i wieksze od jedynki
 * offsety (`Offsets must be monotonically non-decreasing`) i wywala cala
 * hydratacje. Dlatego pierwsza warstwa nie ma wejscia, a ostatnia wyjscia —
 * co zreszta jest tym, czego chcemy: scena otwierajaca stoi na miejscu od
 * przyklejenia sceny, a zamykajaca zostaje az do jej zwolnienia.
 */
export function useLayerFade(
  progress: MotionValue<number>,
  start: number,
  end: number,
  shift = 14,
): {
  opacity: MotionValue<number>
  y: MotionValue<number>
  visibility: MotionValue<'hidden' | 'visible'>
} {
  const fadeIn = start - FADE > 0
  const fadeOut = end + FADE < 1

  const keyframes = [
    ...(fadeIn ? [start - FADE] : []),
    start,
    end,
    ...(fadeOut ? [end + FADE] : []),
  ]
  const opacities = [...(fadeIn ? [0] : []), 1, 1, ...(fadeOut ? [0] : [])]
  const offsets = [...(fadeIn ? [shift] : []), 0, 0, ...(fadeOut ? [-shift] : [])]

  const opacity = useScrollMap(progress, keyframes, opacities)

  return {
    opacity,
    y: useScrollMap(progress, keyframes, offsets),
    // Warstwa wygaszona znika z malowania calkowicie. Samo `opacity: 0`
    // zostawia ja w drzewie kompozycji — wystarczy blad zaokraglenia albo
    // subpikselowe przenikanie, zeby przez aktywny ekran przebil poprzedni.
    visibility: useTransform(opacity, (value) => (value < 0.02 ? 'hidden' : 'visible')),
  }
}
