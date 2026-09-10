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
 * DOKLADNIE polowa przerwy miedzy oknami warstw (0,07), wiec przejscia sa
 * scisle sekwencyjne: warstwa gasnie do zera w tym samym punkcie, w ktorym
 * nastepna zaczyna sie pojawiac. Zadna para nie maluje sie naraz.
 *
 * Przy 0,045 zakresy zachodzily na siebie o 0,02 postepu i w tym oknie jedna
 * warstwa przeswitywala przez druga — kalka, ktora widac bylo w kazdym
 * przewinieciu.
 */
const FADE = 0.035

export interface LayerFade {
  opacity: MotionValue<number>
  transform: MotionValue<string>
  visibility: MotionValue<'hidden' | 'visible'>
}

/**
 * Okno widocznosci jednej warstwy sceny — przejscie SEKWENCYJNE.
 *
 * Uzywa tego `NumbersStory`: piec kolosalnych liczb na czerni. Tam rozdzielone
 * okna sa zaleta, a nie wada — liczba ma zniknac, zanim pojawi sie nastepna,
 * bo dwie cyfry przenikajace przez siebie sa nieczytelne. Miedzy oknami jest
 * wiec punkt, w ktorym obie warstwy maja `opacity` 0, i tak ma byc.
 *
 * Do warstw, ktore NIE MOGA znikac naraz — czyli do nalozonych na siebie
 * replik interfejsu w `ProductJourney` — sluzy `useSceneLayer` nizej.
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


/* ══════════════════════════════════════════════════════════════════════
 * Sceny 01-05: przejscie, ktore ani nie ciemnieje, ani nie przenika
 * ══════════════════════════════════════════════════════════════════════
 *
 * `ProductJourney` ma trudniejszy przypadek niz `NumbersStory`: nie przelacza
 * pieciu liczb, tylko piec GESTYCH replik interfejsu, i to w jednej ramce,
 * ktora przez cala sekcje stoi nieruchomo. Dwa oczywiste przejscia zawodza tu
 * z dwoch przeciwnych powodow:
 *
 *  - **rozdzielone okna** (`useLayerFade`) zostawiaja punkt, w ktorym obie
 *    warstwy maja `opacity` 0. Zmierzone na tym torze przed zmiana: 52 z 201
 *    punktow pomiarowych ponizej progu widocznosci, minimum ROWNE ZERU —
 *    czyli pusta ramka aplikacji w srodku najwazniejszej sekcji strony;
 *  - **przenikanie** (okna nasuniete na siebie) tego punktu nie ma, ale w
 *    polowie przejscia pokazuje OBA ekrany naraz. Na zrzucie z 1440x900 widac
 *    wtedy siatke kalendarza i tabele projektow jedna przez druga — kalke,
 *    ktora na gestym UI czyta sie jak blad renderowania, a nie jak efekt.
 *
 * ── Rozwiazanie: ekran nie przenika, tylko wchodzi ──
 *
 * Warstwa ekranu niesie nieprzezroczyste tlo powierzchni, na ktorej lezy
 * (`--lp-s1`), i WJEZDZA z prawej strony na poprzednia, ktora cofa sie o
 * kilkanascie procent w glab. Przycina je `overflow: hidden` ramki urzadzenia.
 * Zadna klatka nie jest wiec ani pusta, ani podwojnie naswietlona, a samo
 * przejscie czyta sie dokladnie tak, jak obiecuje ta sekcja: jak nawigacja
 * wewnatrz aplikacji, a nie jak przelaczanie zrzutow ekranu.
 *
 * Kierunek bierze sie z jednej, MONOTONICZNIE rosnacej krzywej, wiec
 * przewijanie w gore jest tym samym ruchem odtworzonym wstecz — nie ma
 * osobnej krzywej wejscia i wyjscia do zestrojenia.
 *
 * ── Narracja i breadcrumb ida INACZEJ, i to celowo ──
 *
 * Tekst nie ma prawa przenikac przez tekst: dwa akapity po 50% to nie jest
 * przenikanie filmowe, tylko dwie nieczytelne warstwy liter. Copy dostaje
 * wiec przejscie SEKWENCYJNE — stara mysl gasnie, nowa sie zapala, z
 * kilkupunktowa przerwa miedzy nimi. Przerwa nie boli, bo w tym samym czasie
 * ramka obok jest pelna: „brak tekstu przez chwile" to nie to samo, co
 * „czarny ekran".
 *
 * Podswietlenie sekcji w sidebarze ma jeszcze trzecia krzywa (`spotlight`) —
 * zapala sie na wejsciu sceny i gasnie na wejsciu nastepnej.
 */

/**
 * Ulamek toru, na ktorym scena oddaje ekran nastepnej.
 *
 * Przy pieciu scenach na torze 520svh (desktop) to okolo 38svh przewijania,
 * czyli 2-3 klikniecia kolka: dosc, zeby przejscie bylo czytelnym ruchem, i
 * za malo, zeby uzytkownik zdazyl sie zastanowic, czy strona sie zacieta.
 *
 * WARUNEK: `SWAP` musi byc mniejszy niz 1/n, inaczej okna sasiadow zachodza
 * na siebie i `useTransform` dostaje niemonotoniczny zakres wejsciowy.
 */
const SWAP = 0.09

/**
 * Skad wjezdza ekran wchodzacy, w procentach WLASNEJ szerokosci.
 *
 * Rowno 100, i to jest warunek, a nie zaokraglenie. Warstwa ekranu ma
 * DOKLADNIE rozmiar swojego pola przyciecia (`overflow-clip` siedzi na
 * `.lp-screens`, czyli na kontenerze warstw, a nie na wyzszym elemencie z
 * paddingiem), wiec przy stu procentach stoi tuz za krawedzia — ani piksela
 * w srodku, ani piksela luki, gdy juz ruszy.
 */
const SCREEN_IN = 100

/**
 * O ile ekran schodzacy cofa sie w lewo, gdy nastepny go przykrywa.
 *
 * Parallaksa, nie ucieczka: schodzacy ekran ma zostac pod wchodzacym jako
 * warstwa glebiej, a nie wyjechac za ramke. Przy pelnym przesunieciu (100%)
 * przejscie zamienia sie w karuzele i gubi wrazenie jednej aplikacji.
 *
 * Wartosc MUSI byc mniejsza niz `SCREEN_IN`, bo to ona gwarantuje szczelnosc:
 * w kazdym punkcie przejscia lewa krawedz wchodzacego ekranu stoi na
 * `SCREEN_IN · (1 − t)`, a prawa krawedz schodzacego na `100 − SCREEN_OUT · t`.
 * Przy `SCREEN_OUT < SCREEN_IN` ta druga jest zawsze na prawo od pierwszej —
 * czyli miedzy ekranami nie ma ani jednej klatki z odslonieta ramka.
 */
const SCREEN_OUT = 18

/** Przesuniecie pionowe akapitu narracji na wejsciu i na wyjsciu. */
const COPY_SHIFT = 14

/**
 * Jaka czesc przejscia zajmuje zgaszenie starego tekstu (i, symetrycznie,
 * zapalenie nowego). Dwa razy 0,45 zostawia miedzy nimi 10% przejscia — na
 * torze desktopu okolo 34 px przewijania, czyli tyle, ile trzeba, zeby oko
 * zarejestrowalo zmiane mysli, a nie zdazylo zauwazyc pustki.
 */
const COPY_SPAN = 0.45

/**
 * `smoothstep` (3t² − 2t³) w pieciu punktach.
 *
 * Krzywej nie podajemy jako funkcji `ease`: Motion akceleruje sprzetowo
 * wylacznie pare TABLIC (patrz naglowek pliku), wiec latwiejsze wejscie i
 * wyjscie robimy dodatkowymi klatkami, a nie latwiejsza interpolacja. Piec
 * punktow wystarcza — miedzy nimi zostaje odcinek prosty, a maksymalny blad
 * wzgledem prawdziwego `smoothstep` to okolo 0,02.
 */
const SMOOTH_AT = [0, 0.25, 0.5, 0.75, 1] as const
const SMOOTH_TO = [0, 0.15625, 0.5, 0.84375, 1] as const

/** Klatki jednej krzywej: punkty na torze i wartosci w tych punktach. */
export interface Keyframes<T> {
  stops: number[]
  values: T[]
}

/** Zakres postepu `<start, end>`, oba konce w ulamku toru sekcji. */
export type ProgressWindow = readonly [number, number]

export interface SceneKeyframes {
  /** Ekran w ramce: samo przesuniecie poziome, zero klatek przenikania. */
  screen: Keyframes<string>
  /** Narracja i breadcrumb: przejscie sekwencyjne. */
  copyFade: Keyframes<number>
  copyMove: Keyframes<string>
  /** Podswietlenie sekcji w nawigacji mockupu. */
  spotlight: Keyframes<number>
  /** Poza tym zakresem warstwa ekranu nie ma czego malowac ani co czytac. */
  visible: ProgressWindow
}

/** Okno przejscia na granicy scen `boundary - 1` → `boundary`. */
function swapWindow(boundary: number, count: number): ProgressWindow {
  const at = boundary / count
  return [at - SWAP / 2, at + SWAP / 2]
}

/** Klatki jednego przejscia, rozlozone wedlug `smoothstep`. */
function ramp<T>([start, end]: ProgressWindow, at: (t: number) => T): Keyframes<T> {
  return {
    stops: SMOOTH_AT.map((step) => start + (end - start) * step),
    values: SMOOTH_TO.map(at),
  }
}

/** Zaokraglenie bez `toFixed` — klatki maja byc stabilnymi stringami. */
const round = (value: number, places: number) => {
  const unit = 10 ** places
  return Math.round(value * unit) / unit
}

/**
 * Klatki transformu maja IDENTYCZNA strukture (jedna funkcja CSS, ta sama w
 * kazdej klatce) — bez tego przegladarka nie ma czego interpolowac i animacja
 * spada z kompozytora na main thread.
 */
const screenAt = (percent: number) => `translateX(${round(percent, 2)}%)`
const copyAt = (pixels: number) => `translateY(${round(pixels, 2)}px)`

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
function closeTrack<T>(stops: number[], values: T[]): Keyframes<T> {
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

/**
 * Caly timeline jednej sceny — funkcja CZYSTA, zeby dalo sie przejechac tor
 * punkt po punkcie w tescie. Wartosc policzona przez `useTransform`
 * aktualizuje sie dopiero w petli klatek, wiec w tescie nigdy nie jest tym, co
 * przed chwila ustawiono.
 *
 * Zero recznie dobranych okien: wszystko liczy sie z indeksu, wiec dopisanie
 * szostej sceny nie wymaga przestrajania pozostalych pieciu.
 */
export function sceneKeyframes(index: number, count: number): SceneKeyframes {
  const enter = index > 0 ? swapWindow(index, count) : null
  const exit = index < count - 1 ? swapWindow(index + 1, count) : null

  // Tekst zmienia sie SZYBCIEJ niz ekran i w innym momencie przejscia: stary
  // gasnie na jego poczatku, nowy zapala sie na koncu.
  const copyIn = enter ? ([enter[1] - SWAP * COPY_SPAN, enter[1]] as ProgressWindow) : null
  const copyOut = exit ? ([exit[0], exit[0] + SWAP * COPY_SPAN] as ProgressWindow) : null

  const screenIn = enter ? ramp(enter, (t) => screenAt(SCREEN_IN * (1 - t))) : null
  const screenOut = exit ? ramp(exit, (t) => screenAt(-SCREEN_OUT * t)) : null

  const fadeIn = copyIn ? ramp(copyIn, (t) => t) : null
  const fadeOut = copyOut ? ramp(copyOut, (t) => 1 - t) : null
  const moveIn = copyIn ? ramp(copyIn, (t) => copyAt(COPY_SHIFT * (1 - t))) : null
  const moveOut = copyOut ? ramp(copyOut, (t) => copyAt(-COPY_SHIFT * t)) : null

  const spotIn = enter ? ramp(enter, (t) => t) : null
  const spotOut = exit ? ramp(exit, (t) => 1 - t) : null

  return {
    screen: closeTrack(
      [0, ...(screenIn?.stops ?? []), ...(screenOut?.stops ?? []), 1],
      [
        screenAt(enter ? SCREEN_IN : 0),
        ...(screenIn?.values ?? []),
        ...(screenOut?.values ?? []),
        screenAt(exit ? -SCREEN_OUT : 0),
      ],
    ),
    copyFade: closeTrack(
      [0, ...(fadeIn?.stops ?? []), ...(fadeOut?.stops ?? []), 1],
      [enter ? 0 : 1, ...(fadeIn?.values ?? []), ...(fadeOut?.values ?? []), exit ? 0 : 1],
    ),
    copyMove: closeTrack(
      [0, ...(moveIn?.stops ?? []), ...(moveOut?.stops ?? []), 1],
      [
        copyAt(enter ? COPY_SHIFT : 0),
        ...(moveIn?.values ?? []),
        ...(moveOut?.values ?? []),
        copyAt(exit ? -COPY_SHIFT : 0),
      ],
    ),
    spotlight: closeTrack(
      [0, ...(spotIn?.stops ?? []), ...(spotOut?.stops ?? []), 1],
      [enter ? 0 : 1, ...(spotIn?.values ?? []), ...(spotOut?.values ?? []), exit ? 0 : 1],
    ),
    /*
      Konce sa NIESKONCZONE, a nie zaciete na 0 i 1: postep potrafi wyjsc poza
      tor (bounce Safari, `scrollRestoration`), a skrajna scena nie ma wtedy
      prawa zniknac.
    */
    visible: [enter ? enter[0] : -Infinity, exit ? exit[1] : Infinity],
  }
}

export interface SceneLayer {
  /** Ekran w ramce urzadzenia. */
  screen: { transform: MotionValue<string>; visibility: MotionValue<'hidden' | 'visible'> }
  /** Narracja i breadcrumb. */
  copy: {
    opacity: MotionValue<number>
    transform: MotionValue<string>
    visibility: MotionValue<'hidden' | 'visible'>
  }
  /** Podswietlenie sekcji w nawigacji mockupu. */
  spotlight: MotionValue<number>
}

/**
 * Zwiazanie klatek sceny z postepem toru.
 *
 * `visibility` to jedyne wartosci, ktore zostaja w JS — nie jest wlasciwoscia
 * akcelerowalna. Kosztuja tyle, co ich zmiany, a zmieniaja sie dwa razy na
 * scene, nie raz na klatke. Bez nich ekran przykryty przez nastepny nadal
 * malowalby sie pod spodem, a wygaszony akapit nadal czytalby czytnik ekranu.
 */
export function useSceneLayer(
  progress: MotionValue<number>,
  index: number,
  count: number,
): SceneLayer {
  const frames = sceneKeyframes(index, count)
  const [from, to] = frames.visible
  const copyOpacity = useTransform(progress, frames.copyFade.stops, frames.copyFade.values)

  return {
    screen: {
      transform: useScrollTransform(progress, frames.screen.stops, frames.screen.values),
      visibility: useTransform(progress, (value) =>
        value >= from && value <= to ? 'visible' : 'hidden',
      ),
    },
    copy: {
      opacity: copyOpacity,
      transform: useScrollTransform(progress, frames.copyMove.stops, frames.copyMove.values),
      visibility: useTransform(copyOpacity, (value) => (value < 0.02 ? 'hidden' : 'visible')),
    },
    spotlight: useTransform(progress, frames.spotlight.stops, frames.spotlight.values),
  }
}
