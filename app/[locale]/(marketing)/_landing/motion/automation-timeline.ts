import { LAYER_FADE } from './scene'
import type { ProgressWindow } from './tokens'

/**
 * Timeline sekcji automatu — TRZY ETAPY jednej historii.
 *
 * Sekcja odpowiada na jedno pytanie („skad aplikacja wie, co wpisac?") i
 * odpowiada na nie po kolei, a nie naraz. Poprzednia wersja pokazywala grafik,
 * obecnosc, kalendarz, wynik i legende w jednym kadrze: wszystko bylo widoczne
 * od pierwszej klatki, wiec nic nie bylo WAZNE.
 *
 *   1. ZASADY    — „tydzien wyglada tak". Sam grafik, nic wiecej.
 *   2. OBECNOSC  — „a w tych dniach bylem w domu". Grafik robi miejsce,
 *                  wchodzi os wyjazdow.
 *   3. WYNIK     — kalendarz przejmuje ekran i wypelnia sie dzien po dniu,
 *                  a na koncu pokazuje, ile z tego wyszlo.
 *
 * ── Dlaczego okna stoja W OSOBNYM, CZYSTYM MODULE ──
 *
 * Bo sa arytmetyka, a nie stylem: kazde przesuniecie granicy moze cicho
 * nasunac dwie warstwy na siebie (dwa naglowki naraz) albo zostawic miedzy
 * nimi pusty kadr. Jedno i drugie widac dopiero na zywej stronie, w polowie
 * przewijania. Tutaj da sie to przejechac testem
 * (`__test__/landing/automation-timeline.test.ts`).
 *
 * ── Regula, ktora te liczby spelniaja ──
 *
 * Warstwy lezace NA SOBIE (naglowki etapow, kolumna tresci) musza byc
 * rozdzielone co najmniej `2 · LAYER_FADE` — tyle trwa zgaszenie poprzednika
 * plus zapalenie nastepnika. Ponizej tej wartosci `useLayerFade` zaczyna
 * malowac obie naraz.
 */

/** Minimalna przerwa miedzy oknami warstw lezacych na sobie. */
export const STAGE_GAP = 2 * LAYER_FADE

/**
 * Etap trzeci dostaje ponad polowe toru, i to nie jest niesprawiedliwosc:
 * pierwsze dwa etapy USTAWIAJA regule (jeden rzut oka wystarczy), a trzeci ja
 * WYKONUJE — trzydziesci dni musi wpasc do siatki na tyle wolno, zeby bylo
 * widac, ze wpadaja po kolei, a nie pojawiaja sie naraz.
 */
export const AUTOMATION = {
  /** Naglowek etapu 1 — jedna mysl: „kalendarz moze wypelnic sie sam". */
  rulesCopy: [0, 0.18] as ProgressWindow,
  /** Naglowek etapu 2 — „i wie, kiedy Cie nie ma". */
  presenceCopy: [0.25, 0.38] as ProgressWindow,
  /** Naglowek etapu 3 — zostaje do konca sekcji. */
  resultCopy: [0.45, 1] as ProgressWindow,

  /** Kolumna zasad (grafik + obecnosc) zyje przez oba pierwsze etapy. */
  rulesLayer: [0, 0.38] as ProgressWindow,
  /** Kalendarz przejmuje ekran dopiero, gdy zasady z niego zejda. */
  calendarLayer: [0.45, 1] as ProgressWindow,

  /**
   * Os obecnosci wchodzi PRZED swoim naglowkiem o kilka punktow: ruch w
   * kadrze jest tym, co kaze oku wrocic do tresci, a dopiero potem zdanie
   * nazywa to, co wlasnie sie pojawilo.
   */
  presenceReveal: [0.22, 0.32] as ProgressWindow,

  /**
   * Zakres, w ktorym siatka wypelnia sie dzien po dniu. Zaczyna sie PO
   * wejsciu kalendarza — pusty miesiac musi byc widoczny przez chwile, bo
   * inaczej nie widac, ze cokolwiek go wypelnilo.
   */
  fill: [0.48, 0.88] as ProgressWindow,

  /** Wynik miesiaca — ostatnie, co pojawia sie w sekcji, i zostaje. */
  result: [0.9, 0.96] as ProgressWindow,
} as const

/**
 * Pary warstw, ktore leza NA SOBIE i nie moga byc widoczne jednoczesnie.
 * Kolejnosc w kazdej parze jest chronologiczna.
 */
export const AUTOMATION_STACKED: readonly (readonly [ProgressWindow, ProgressWindow])[] = [
  [AUTOMATION.rulesCopy, AUTOMATION.presenceCopy],
  [AUTOMATION.presenceCopy, AUTOMATION.resultCopy],
  [AUTOMATION.rulesLayer, AUTOMATION.calendarLayer],
]
