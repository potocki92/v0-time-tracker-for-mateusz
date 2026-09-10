'use client'

import { useSyncExternalStore } from 'react'

/**
 * Profil animacji landingu.
 *
 * Landing ma JEDEN uklad i JEDNA tresc, ale dwa profile ruchu. Roznica nie
 * jest kosmetyczna: telefon dostaje mniej scen naraz, mniej wartosci
 * sterowanych scrollem i tansze efekty (bez rotacji 3D, bez `backdrop-filter`,
 * bez cienia o duzym promieniu). Powod jest fizyczny — na desktopie klatke
 * gubi sie w szumie, na telefonie kazda operacja w klatce scrollowania widac
 * jako "animacja nie nadaza za palcem".
 *
 * Prog to `lg` z Tailwinda (1024 px), czyli DOKLADNIE ten sam prog, na ktorym
 * landing przelacza uklady kolumn. Jeden prog dla ukladu i dla ruchu, zeby
 * nie powstalo pasmo szerokosci z ukladem desktopu i profilem telefonu.
 */
const DESKTOP_QUERY = '(min-width: 1024px)'

export type MotionProfile = 'mobile' | 'desktop'

/**
 * Serwer i PIERWSZY render klienta zwracaja zawsze `mobile`.
 *
 * To nie jest domysl "wiekszosc ruchu jest mobilna", tylko warunek braku
 * bledu hydratacji: `matchMedia` nie istnieje na serwerze, wiec obie strony
 * musza zgodzic sie na te sama wartosc. Lzejszy profil jest bezpieczniejszym
 * domyslem — desktop doklada efekty po hydratacji, a nie odwrotnie.
 *
 * WAZNE: od tej wartosci nie moze zalezec zaden rozmiar. Wysokosci torow
 * przewijania stoja w `landing.css` pod media query, wiec przelaczenie
 * profilu po hydratacji nie przesuwa ani jednego piksela ukladu.
 */
const getServerSnapshot = (): MotionProfile => 'mobile'

const getSnapshot = (): MotionProfile =>
  window.matchMedia(DESKTOP_QUERY).matches ? 'desktop' : 'mobile'

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Zwraca profil ruchu i przerenderowuje komponent, gdy okno przekroczy prog
 * (obrot telefonu, zmiana rozmiaru okna). To JEDYNE zrodlo tej decyzji w
 * landingu — zaden komponent nie czyta `window.innerWidth` samodzielnie.
 */
export function useMotionProfile(): MotionProfile {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * `prefers-reduced-motion`, ale bezpieczne dla hydratacji.
 *
 * `useReducedMotion` z Motion czyta media query juz w PIERWSZYM renderze
 * (`useState(prefersReducedMotion.current)`). Na serwerze nie ma `matchMedia`,
 * wiec wychodzi `false`, a u uzytkownika z wlaczonym ograniczeniem ruchu —
 * `true`. Sceny, ktore na tej podstawie wybieraja inne drzewo (patrz
 * `ProductJourney`), dostawaly wiec bledy hydratacji (React #418) dokladnie u
 * tych osob, ktorym fallback ma sluzyc.
 *
 * Tutaj serwer i pierwszy render klienta zgadzaja sie na `false`, a prawdziwa
 * wartosc przychodzi zaraz po hydratacji. Sam ruch jest i tak wylaczony
 * wczesniej — `landing.css` ma komplet regul `@media (prefers-reduced-motion:
 * reduce)` z `!important`, ktore bija style inline i animacje WAAPI.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false)
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

const getReducedMotion = (): boolean => window.matchMedia(REDUCED_QUERY).matches

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
