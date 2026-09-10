'use client'

import type { RefObject } from 'react'
import { useScroll, useTransform, type MotionValue } from 'framer-motion'

/**
 * Motion landingu — postep scen i warstwy sterowane scrollem.
 *
 * Zasady, ktore te helpery wymuszaja:
 *  - jedno zrodlo postepu na scene (`useScroll` z targetem), zero wlasnych
 *    listenerow `window.scroll`,
 *  - zaden przelicznik nie dotyka stanu Reacta, wiec przewijanie nie
 *    powoduje rerenderow,
 *  - animujemy WYLACZNIE `opacity` i `transform`, i to w formie, ktora Motion
 *    potrafi oddac przegladarce (patrz nizej).
 *
 * ── Dlaczego `transform` jako gotowy string, a nie `y` / `scale` ──
 *
 * Motion przenosi wartosc sterowana scrollem na natywna animacje
 * (ScrollTimeline / ViewTimeline + Web Animations API) tylko wtedy, gdy klucz
 * stylu jest na jego liscie akcelerowalnych: `opacity`, `transform`,
 * `filter`, `clipPath`, `backgroundColor`. Skladowe transformu — `y`, `scale`,
 * `rotateX` — na tej liscie NIE SA, bo Motion musi je najpierw skleic w jeden
 * string. Kazda taka skladowa zostaje wiec w JS i placi za siebie zapisem
 * stylu w kazdej klatce przewijania.
 *
 * Dlatego sceny skladaja caly transform samodzielnie i podaja go jako jedna
 * wartosc. Animacja trafia na kompozytor: main thread nie robi w klatce
 * przewijania nic, a Safari od 26.4 liczy takie animacje na osobnym watku.
 * Cena: keyframe'y transformu musza miec IDENTYCZNA strukture (te same
 * funkcje CSS w tej samej kolejnosci), inaczej przegladarka nie ma czego
 * interpolowac.
 *
 * ── Dlaczego zniknal `useScrollMap` ──
 *
 * Do wersji 12.38 stal tu wlasny helper, ktory PODAWAL Motion gotowa funkcje
 * zamiast pary tablic — wylacznie po to, zeby zablokowac sciezke akcelerowana.
 * Blad byl w Motion, nie w scenach: `useScroll({ target })` budowal
 * ViewTimeline w chwili, gdy `ref.current` byl jeszcze pusty, wiec wpadal na
 * ScrollTimeline calego dokumentu i cache'owal go na stale. Postep liczyl sie
 * wzgledem strony, nie wzgledem toru sceny — pierwsza warstwa nigdy nie
 * gasla, dwie sceny zostawaly widoczne naraz.
 *
 * Motion 12.39 naprawil to wprost ("useScroll: Fix hardware acceleration when
 * tracking an element" + "Support hydrating target and container refs from
 * anywhere in the tree"): przypiecie timeline'u czeka teraz na hydratacje
 * refa. Workaround stracil powod istnienia i zostal usuniety — sceny wracaja
 * na standardowe `useTransform(source, inputRange, outputRange)`.
 */

/**
 * Interpolacja `transform` sterowana scrollem.
 *
 * Kazdy keyframe dostaje ten sam zestaw funkcji CSS — to warunek, zeby
 * interpolowala go przegladarka, a nie JavaScript.
 */
export function useScrollTransform(
  source: MotionValue<number>,
  inputRange: readonly number[],
  outputRange: readonly string[],
): MotionValue<string> {
  return useTransform(source, [...inputRange], [...outputRange])
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
 * Postep sekcji WCHODZACEJ w ekran: 0 gdy jej gorna krawedz dotyka dolu
 * okna, 1 gdy dolna krawedz dotyka dolu okna.
 *
 * ── Dlaczego wlasnie ten offset ──
 *
 * Droga miedzy tymi dwoma stanami to DOKLADNIE wysokosc sekcji, wiec
 * wysokosc okna nie wchodzi do wzoru. Postep ma przez to czytelne znaczenie
 * geometryczne: `p` to ulamek sekcji, ktory zdazyl przejsc nad dolna
 * krawedzia ekranu. Element lezacy na glebokosci `f` (w ulamku wysokosci
 * sekcji) staje sie widoczny dokladnie przy `p = f` — na kazdym telefonie i
 * na kazdym monitorze tak samo.
 *
 * To jest wlasnosc, na ktorej stoi timeline sekcji `capabilities`: okna
 * czasowe kart czyta sie tam jak POZYCJE W UKLADZIE, a nie jak liczby
 * dobrane na oko (patrz `./capability.ts`).
 *
 * `useTrackProgress` tego nie da: jego `['start start', 'end end']` opisuje
 * tor przyklejonej sceny, gdzie 0 wypada dopiero wtedy, gdy gora sekcji
 * dojedzie do gory ekranu — czyli gdy pierwsza karta jest juz dawno widoczna.
 *
 * `['start end', 'end end']` to nazwany zakres `ViewTimeline` (`entry`), wiec
 * sciezka akcelerowana sprzetowo zostaje otwarta (patrz naglowek pliku).
 */
export function useEntryProgress(ref: RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
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

export interface LayerFade {
  opacity: MotionValue<number>
  transform: MotionValue<string>
  visibility: MotionValue<'hidden' | 'visible'>
}

/**
 * Okno widocznosci jednej warstwy sceny. Warstwy leza na sobie w gridzie,
 * wiec przejscie to zmiana `opacity` + kilkanascie pikseli przesuniecia —
 * bez przerysowania ukladu.
 *
 * Klatki NIE MOGA wyjsc poza <0, 1>: przy scroll-linked animacji Motion
 * oddaje je Web Animations API, ktore odrzuca ujemne i wieksze od jedynki
 * offsety (`Offsets must be monotonically non-decreasing`). Dlatego pierwsza
 * warstwa nie ma wejscia, a ostatnia wyjscia — co zreszta jest tym, czego
 * chcemy: scena otwierajaca stoi na miejscu od przyklejenia sceny, a
 * zamykajaca zostaje az do jej zwolnienia.
 */
export function useLayerFade(
  progress: MotionValue<number>,
  start: number,
  end: number,
  shift = 14,
): LayerFade {
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

  const opacity = useTransform(progress, keyframes, opacities)

  return {
    opacity,
    transform: useScrollTransform(
      progress,
      keyframes,
      offsets.map((offset) => `translateY(${offset}px)`),
    ),
    // Warstwa wygaszona znika z malowania calkowicie. Samo `opacity: 0`
    // zostawia ja w drzewie kompozycji — wystarczy blad zaokraglenia albo
    // subpikselowe przenikanie, zeby przez aktywny ekran przebil poprzedni.
    //
    // To JEDYNA wartosc sceny, ktora zostaje w JS: `visibility` nie jest
    // wlasciwoscia akcelerowalna. Kosztuje tyle, co jej zmiany — a zmienia
    // sie dwa razy na scene, nie raz na klatke.
    visibility: useTransform(opacity, (value) => (value < 0.02 ? 'hidden' : 'visible')),
  }
}
