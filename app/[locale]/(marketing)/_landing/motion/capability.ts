'use client'

import { useTransform, type MotionValue } from 'framer-motion'

import type { MotionProfile } from './profile'
import { useScrollTransform } from './scene'

/**
 * Timeline sekcji „mozliwosci" — piec kart na JEDNYM postepie przewijania.
 *
 * ── Skad bierze sie postep ──
 *
 * Sekcja nie jest przyklejona (nie ma `sticky`, nie ma sztucznego toru).
 * Postep daje `useEntryProgress` zalozony na SIATCE KART, wiec `p` znaczy:
 * „taki ulamek siatki przeszedl juz nad dolna krawedzia ekranu". Karta
 * lezaca na glebokosci `f` siatki staje sie widoczna dokladnie przy `p = f`,
 * niezaleznie od wysokosci okna — dlatego okna czasowe nizej to nie sa
 * liczby dobrane na oko, tylko ODCZYTANE POZYCJE W UKLADZIE.
 *
 * Konsekwencja, ktora trzeba znac przed zmiana ukladu: **zmiana siatki
 * zmienia timeline**. Dwie karty w jednym wierszu maja te sama glebokosc,
 * wiec nie da sie ich rozsunac w czasie inaczej niz o kilka procent — i
 * dobrze, bo animowanie karty, ktorej nie widac (albo ktora stoi na ekranie
 * od dwoch sekund) to dokladnie ta „animacja doganiajaca scroll", ktorej ta
 * sekcja ma nie miec.
 *
 * ── Dlaczego desktop ma dwa takty, a telefon piec ──
 *
 * Desktop uklada karty w bento 7+5 / 4+4+4, czyli w DWA wiersze. Sa wiec dwa
 * momenty, w ktorych cokolwiek wchodzi na ekran; w obrebie wiersza karty
 * dostaja delikatne przesuniecie (0,06 toru), ktore czyta sie jako przebieg
 * od lewej do prawej.
 *
 * Ponizej `lg` siatka ma jedna kolumne, wiec pieciu kartom odpowiada piec
 * osobnych taktow — tam timeline jest naprawde sekwencyjny.
 *
 * ── Czego ten modul NIE robi ──
 *
 * Nie animuje ani jednej wlasciwosci ukladu i nie oddaje Motion skladowych
 * transformu. Karta dostaje `opacity` (liczba) i `transform` (gotowy string)
 * — jedyne dwie rzeczy, ktore przegladarka policzy poza main threadem.
 * Uzasadnienie stoi w naglowku `./scene.ts`.
 */

/** Kolejnosc kart = kolejnosc opowiesci. Zmiana kolejnosci = zmiana timeline'u. */
export const CAPABILITY_KEYS = [
  'tracker',
  'calendar',
  'invoices',
  'reports',
  'integrations',
] as const

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number]

/** Zakres postepu `<start, end>` — oba konce w ulamku toru sekcji. */
export type ProgressWindow = readonly [number, number]

/**
 * JEDYNE miejsce z „magicznymi liczbami" tej sekcji.
 *
 * Kazde okno to `[poczatek wejscia, koniec wejscia]` w ulamku wysokosci
 * siatki kart. Zeby dodac szosta karte: dopisz klucz do `CAPABILITY_KEYS`,
 * dopisz jej okno w obu profilach i przelicz pozostale — `capabilityWindows`
 * ma test, ktory pilnuje, ze okna sa rosnace i mieszcza sie w <0, 1>.
 *
 * ── Skad te konkretne wartosci ──
 *
 * Z POMIARU, nie z wyczucia. Ponizsze glebokosci to `f` kazdej karty
 * odczytane w przegladarce (Chromium, 100% zoom, jezyk polski — najdluzsze
 * copy z trzech):
 *
 *   desktop 1280x720 i 1440x900 — siatka 720 px, dwa wiersze
 *     wiersz 1 (tracker, kalendarz)         f 0,00 → 0,46
 *     wiersz 2 (faktury, raporty, wymiana)  f 0,49 → 0,99
 *
 *   telefon 390x844 i 430x932 — siatka ~1510 px, piec wierszy
 *     tracker    0,00 → 0,21     kalendarz 0,22 → 0,41
 *     faktury    0,42 → 0,67     raporty   0,68 → 0,84
 *     wymiana    0,86 → 1,00
 *
 * Kazde okno zaczyna sie tam, gdzie gorna krawedz karty wychodzi zza dolu
 * ekranu, i konczy mniej wiecej po dwoch trzecich jej wysokosci — czyli
 * dokladnie wtedy, gdy karta jest juz na ekranie, ale jeszcze nie stoi.
 * Animacja nie ma wiec ani jednej klatki poza polem widzenia i ani jednej
 * po fakcie („animacja doganiajaca scroll").
 *
 * Na desktopie karty jednego wiersza maja TE SAMA glebokosc, wiec rozjezdzaja
 * sie tylko o 0,05 — tyle, zeby oko zlapalo kierunek od lewej do prawej, i
 * za malo, zeby ktoras wygladala na zapomniana. Piec osobnych taktow ma
 * dopiero uklad jednokolumnowy.
 *
 * Ostatnie okno konczy sie przed 1,0 celowo: `capabilityStep` przesuwa pasmo
 * tresci karty w prawo o `INNER_LAG`, a klatki animacji sterowanej scrollem
 * nie moga wyjsc poza <0, 1> (Web Animations API odrzuca takie offsety).
 */
const ENTER: Record<MotionProfile, Record<CapabilityKey, ProgressWindow>> = {
  desktop: {
    // ── wiersz 1: 7 + 5 kolumn ──
    tracker: [0.0, 0.3],
    calendar: [0.05, 0.35],
    // ── wiersz 2: 4 + 4 + 4 kolumny ──
    invoices: [0.49, 0.79],
    reports: [0.54, 0.84],
    integrations: [0.59, 0.89],
  },
  mobile: {
    // Jedna kolumna, wiec kazda karta ma wlasny takt.
    tracker: [0.0, 0.14],
    calendar: [0.22, 0.35],
    invoices: [0.42, 0.58],
    reports: [0.68, 0.79],
    integrations: [0.85, 0.96],
  },
}

/**
 * Charakter wejscia karty. Wszystkie wartosci sa CELOWO male: sekcja ma sie
 * skladac, a nie latac po ekranie.
 */
const CARD = {
  /**
   * Karta nigdy nie schodzi do zera. Po pierwsze dlatego, ze ma sie
   * „wylaniac", a nie „wskakiwac". Po drugie — i wazniejsze — bo dzieki temu
   * ZADNA klatka timeline'u nie jest niewidoczna, takze przed hydratacja i
   * takze gdyby JavaScript nigdy nie wystartowal.
   */
  enterOpacity: 0.3,
  /**
   * Po swoim takcie karta przygasa zamiast zostac na pelnej jasnosci —
   * najjasniejsza jest zawsze ta, przy ktorej stoi scroll, wiec sekcja czyta
   * sie jako budowana, a nie jako gotowa plansza.
   *
   * 0,9 to dol tego, na co pozwala kontrast: najsciemniejszy tekst w karcie
   * to `--lp-ink-2` (0,62 alfy na czerni), czyli po przygasnieciu 0,558 —
   * nadal nad progiem 0,50, ponizej ktorego 11-pikselowy tekst przestaje
   * spelniac WCAG AA. Dlatego karty uzywaja `lp-cap-label`, a nie
   * `lp-eyebrow` (0,50 alfy) — patrz `landing.css`.
   */
  settledOpacity: 0.9,
  /** Ile toru zajmuje samo przygasanie. */
  settleSpan: 0.12,
  /** Przesuniecie pionowe na wejsciu. */
  shiftPx: 22,
  /** Skala na wejsciu. Ponizej 0,97 zaczyna byc widac zmiane ostrosci tekstu. */
  scale: 0.978,
} as const

/**
 * O ile pasmo tresci karty spoznia sie za sama karta — w ulamku DLUGOSCI
 * okna karty, nie calego toru. Dzieki temu spoznienie skaluje sie razem z
 * oknem i nie trzeba go stroic osobno dla telefonu.
 */
const INNER_LAG = 0.35

/** Jaka czesc pasma zajmuje pojedynczy krok. Ponizej 1 kroki zachodza na siebie. */
const INNER_STEP = 0.55

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Rozciaga klatki na CALY tor <0, 1>, przytrzymujac wartosc skrajna przed
 * pierwsza i po ostatniej klatce.
 *
 * ── Dlaczego to jest konieczne, a nie kosmetyczne ──
 *
 * Kiedy Motion odda wartosc przegladarce (ScrollTimeline + Web Animations
 * API), lista klatek staje sie zwyklym `KeyframeEffect`. A specyfikacja WAAPI
 * mowi, ze jesli skrajna klatka nie stoi na offsecie 0 albo 1, przegladarka
 * DOPISUJE tam klatke neutralna o wartosci wyjsciowej elementu. Efekt na
 * torze `[0.49, 0.79] → [0.3, 1]` jest taki, ze po 0,79 wartosc nie zostaje
 * na jedynce, tylko plynnie wraca do 0,3 az do konca toru.
 *
 * Zmierzone w Chromium na tej sekcji przed poprawka: karta „Faktury"
 * osiagala 0,99 przy p = 0,80 i schodzila z powrotem do 0,30 przy p = 1,00 —
 * czyli gasla dokladnie wtedy, gdy uzytkownik na nia patrzyl. Sceny
 * przyklejone (`useLayerFade`) tego nie widza, bo przy p = 1 sa juz za
 * ekranem; ta sekcja zostaje na ekranie, wiec musi domknac tor jawnie.
 *
 * Punkty rowne poprzedniemu sa scalane: `useTransform` wymaga scisle
 * rosnacego zakresu wejsciowego, a okno karty moze zaczynac sie w zerze albo
 * konczyc w jedynce.
 */
function holdOutside<T>(stops: readonly number[], values: readonly T[]): Keyframes<T> {
  const outStops: number[] = []
  const outValues: T[] = []

  stops.forEach((stop, index) => {
    if (outStops.length > 0 && stop <= outStops[outStops.length - 1]) {
      // Ten sam punkt na torze — zostaje wartosc pozniejsza w kolejnosci.
      outValues[outValues.length - 1] = values[index]
      return
    }
    outStops.push(stop)
    outValues.push(values[index])
  })

  return { stops: outStops, values: outValues }
}

/** Okno wejscia karty w podanym profilu ruchu. */
export function capabilityWindow(key: CapabilityKey, profile: MotionProfile): ProgressWindow {
  return ENTER[profile][key]
}

/** Caly timeline profilu — do testow i do dokumentacji, nie do renderu. */
export function capabilityWindows(profile: MotionProfile): ProgressWindow[] {
  return CAPABILITY_KEYS.map((key) => ENTER[profile][key])
}

/**
 * Okno pojedynczego kroku WEWNATRZ karty (wiersz kalendarza, pozycja
 * faktury, slupek raportu, chip integracji).
 *
 * Pasmo krokow to okno karty przesuniete w prawo o `INNER_LAG` — tresc
 * wchodzi minimalnie po ramce, wiec czyta sie jako „karta sie otwiera", a
 * nie jako „wszystko naraz". Kroki zachodza na siebie (`INNER_STEP` < 1),
 * zeby stagger byl ciagly, a nie klikany.
 *
 * Funkcja jest czysta — cala arytmetyka progow ma test jednostkowy.
 */
export function capabilityStep(
  window: ProgressWindow,
  index: number,
  count: number,
): ProgressWindow {
  const [start, end] = window
  const span = end - start

  const bandStart = clamp01(start + span * INNER_LAG)
  const bandEnd = clamp01(end + span * INNER_LAG)
  const band = bandEnd - bandStart

  const stepSpan = band * INNER_STEP
  // Jeden krok dostaje cale pasmo; przy wiekszej liczbie reszta pasma
  // rozklada sie rowno na przesuniecia miedzy krokami.
  const stagger = count > 1 ? (band - stepSpan) / (count - 1) : 0
  const stepStart = bandStart + stagger * index

  return [stepStart, Math.min(1, stepStart + (count > 1 ? stepSpan : band))]
}

export interface CapabilityMotion {
  opacity: MotionValue<number>
  transform: MotionValue<string>
}

/**
 * Klatki jednej krzywej: punkty na torze i wartosci w tych punktach.
 *
 * Arytmetyka timeline'u stoi w CZYSTYCH funkcjach `*Keyframes`, a hooki nizej
 * tylko podaja je Motion. Nie jest to podzial dla ozdoby: dopiero tak da sie
 * przejechac caly tor w tescie i sprawdzic, ze zaden jego punkt nie chowa
 * karty (`__test__/landing/capability-motion.test.ts`). Wartosc wyliczona
 * przez `useTransform` aktualizuje sie dopiero w petli klatek, wiec w tescie
 * nigdy nie jest tym, co przed chwila ustawiono.
 */
export interface Keyframes<T> {
  stops: number[]
  values: T[]
}

export interface MotionKeyframes {
  fade: Keyframes<number>
  transform: Keyframes<string>
}

/**
 * Klatki calej karty: jedna krzywa `opacity` i jeden gotowy `transform`.
 *
 * Klatki transformu maja IDENTYCZNA strukture (`translateY(...) scale(...)`)
 * — bez tego przegladarka nie ma czego interpolowac i animacja spada z
 * kompozytora na main thread.
 */
export function capabilityCardKeyframes(
  key: CapabilityKey,
  profile: MotionProfile,
): MotionKeyframes {
  const [start, end] = capabilityWindow(key, profile)
  const settleAt = Math.min(1, end + CARD.settleSpan)
  const settled = settleAt > end ? CARD.settledOpacity : 1
  const away = `translateY(${CARD.shiftPx}px) scale(${CARD.scale})`
  const home = 'translateY(0px) scale(1)'

  return {
    fade: holdOutside(
      [0, start, end, settleAt, 1],
      [CARD.enterOpacity, CARD.enterOpacity, 1, settled, settled],
    ),
    transform: holdOutside([0, start, end, 1], [away, away, home, home]),
  }
}

/**
 * Klatki jednego kroku wewnatrz karty.
 *
 * `shift` jest mniejszy niz przesuniecie karty (6-10 px zamiast 22) — tresc
 * ma sie ulozyc w srodku ramki, a nie powtorzyc jej gestu.
 */
export function capabilityStepKeyframes(window: ProgressWindow, shift: number): MotionKeyframes {
  const [start, end] = window
  const away = `translateY(${shift}px)`
  const home = 'translateY(0px)'

  return {
    fade: holdOutside([0, start, end, 1], [0, 0, 1, 1]),
    transform: holdOutside([0, start, end, 1], [away, away, home, home]),
  }
}

/**
 * Klatki slupka wykresu: `scaleY(0) → scaleY(1)` z zaczepem przy podstawie.
 *
 * Slupek ma STALA wysokosc docelowa (zmienna CSS `--lp-bar`, ustawiona raz),
 * a rosnie wylacznie transformem. Animowanie `height`, jak robila to stara
 * implementacja bento, kazaloby przegladarce przeliczac uklad w kazdej
 * klatce przewijania — dokladnie ta zasada, ktora `docs/landing-motion.md`
 * stawia na pierwszym miejscu.
 *
 * Slupek nie znika calkiem przed swoim taktem (0,4), bo przy `scaleY(0)` i
 * tak nie ma czego zobaczyc, a pelne zero kazaloby przegladarce zdejmowac go
 * z drzewa kompozycji i wstawiac z powrotem.
 */
export function capabilityBarKeyframes(window: ProgressWindow): MotionKeyframes {
  const [start, end] = window

  return {
    fade: holdOutside([0, start, end, 1], [0.4, 0.4, 1, 1]),
    transform: holdOutside([0, start, end, 1], ['scaleY(0)', 'scaleY(0)', 'scaleY(1)', 'scaleY(1)']),
  }
}

/**
 * Zwiazanie gotowych klatek z postepem sekcji.
 *
 * Nazwa zaczyna sie od `use`, bo to hook: w srodku sa dwa `useTransform`.
 * Wolno go wiec wolac wylacznie bezwarunkowo, z gory komponentu — dokladnie
 * tak, jak robia to trzy hooki nizej.
 */
function useBoundKeyframes(
  progress: MotionValue<number>,
  keyframes: MotionKeyframes,
): CapabilityMotion {
  return {
    opacity: useTransform(progress, keyframes.fade.stops, keyframes.fade.values),
    transform: useScrollTransform(
      progress,
      keyframes.transform.stops,
      keyframes.transform.values,
    ),
  }
}

/** Ruch calej karty. */
export function useCapabilityCardMotion(
  progress: MotionValue<number>,
  key: CapabilityKey,
  profile: MotionProfile,
): CapabilityMotion {
  return useBoundKeyframes(progress, capabilityCardKeyframes(key, profile))
}

/**
 * Ruch jednego kroku wewnatrz karty.
 *
 * WAZNE: to jest hook, wiec wywoluje sie go jawnie, po jednym razie na krok.
 * Petla po tablicy zlamalaby zasady hookow, a przede wszystkim otworzylaby
 * droge do „useTransform na kazdym elemencie listy", czego ten landing
 * swiadomie nie robi (patrz `docs/landing-motion.md`, zasada 3).
 */
export function useCapabilityStepMotion(
  progress: MotionValue<number>,
  window: ProgressWindow,
  shift = 8,
): CapabilityMotion {
  return useBoundKeyframes(progress, capabilityStepKeyframes(window, shift))
}

/** Ruch slupka wykresu. */
export function useCapabilityBarMotion(
  progress: MotionValue<number>,
  window: ProgressWindow,
): CapabilityMotion {
  return useBoundKeyframes(progress, capabilityBarKeyframes(window))
}

/**
 * Parallaksa zielonej poswiaty w karcie trackera — jedyny efekt tej sekcji,
 * ktory nie sluzy czytelnosci, tylko glebi. Kilkanascie pikseli na cala
 * sekcje; wiecej i karta zaczynalaby „plywac" wzgledem wlasnej ramki.
 *
 * Wlaczana TYLKO na desktopie: to dodatkowa warstwa kompozycji z duzym
 * rozmyciem, czyli najdrozszy rodzaj piksela, jaki telefon moze dostac w
 * klatce przewijania.
 */
export function useCapabilityGlowMotion(progress: MotionValue<number>): MotionValue<string> {
  return useScrollTransform(progress, [0, 1], ['translateY(-18px)', 'translateY(18px)'])
}
