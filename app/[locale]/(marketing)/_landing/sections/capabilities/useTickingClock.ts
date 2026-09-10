'use client'

import { useCallback, useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '../../motion/profile'

/**
 * Licznik karty trackera — jedyny ruch na landingu, ktorego NIE prowadzi
 * scroll.
 *
 * ── Dlaczego stoi osobno od reszty ruchu sekcji ──
 *
 * Karta ma pokazac, ze tracker naprawde chodzi, wiec licznik musi tykac
 * rowno raz na sekunde niezaleznie od tego, czy ktos przewija, jak szybko i
 * czy w ogole. Zwiazanie go z postepem przewijania (albo z `requestAnimationFrame`
 * sceny) dawaloby licznik, ktory przyspiesza pod palcem i staje w miejscu —
 * czyli dokladnie odwrotnie, niz dziala tracker w aplikacji.
 *
 * Cena to jeden `setState` na sekunde. Placi go WYLACZNIE panel licznika:
 * hook wola sie w lisciu drzewa karty, wiec sekundowy render nie dotyka ani
 * ramki karty, ani zadnej wartosci sterowanej scrollem.
 *
 * ── prefers-reduced-motion ──
 *
 * Samoczynnie zmieniajaca sie tresc to ruch, wiec przy ograniczonym ruchu
 * licznik startuje zatrzymany — nadal z pelna wartoscia na ekranie i nadal z
 * dzialajacym przyciskiem startu (WCAG 2.2.2: uzytkownik ma miec kontrole,
 * nie ma stracic tresci).
 *
 * Zapis stanu siedzi w efekcie, a nie w `useState`, bo `usePrefersReducedMotion`
 * z zalozenia zwraca `false` na serwerze i w pierwszym renderze klienta —
 * dzieki temu HTML z serwera zgadza sie z hydratacja (patrz `motion/profile.ts`).
 */

/** 02:14:08 — tyle, zeby bylo widac wszystkie trzy pola licznika. */
const TRACKER_START_SECONDS = 2 * 3600 + 14 * 60 + 8

export interface TickingClock {
  seconds: number
  running: boolean
  toggle: () => void
  stop: () => void
}

export function useTickingClock(): TickingClock {
  const reduceMotion = usePrefersReducedMotion()
  const [seconds, setSeconds] = useState(TRACKER_START_SECONDS)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (reduceMotion) setRunning(false)
  }, [reduceMotion])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  return {
    seconds,
    running,
    toggle: useCallback(() => setRunning((value) => !value), []),
    stop: useCallback(() => {
      setRunning(false)
      setSeconds(TRACKER_START_SECONDS)
    }, []),
  }
}

/**
 * HH:MM:SS — ten sam zapis, co `SidebarTracker` w aplikacji.
 *
 * Nie idzie przez `lib/format`: to nie jest format zalezny od jezyka (zegar
 * licznika wyglada tak samo po polsku, niemiecku i angielsku), tylko staly
 * uklad trzech pol z zerem wiodacym.
 */
export function formatElapsed(total: number): string {
  const value = Math.max(0, Math.floor(total))
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const secs = value % 60

  return [hours, minutes, secs].map((part) => String(part).padStart(2, '0')).join(':')
}
