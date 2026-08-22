'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'

/**
 * Wspolny stan pomiaru czasu. Widget w sidebarze i przycisk w naglowku
 * obszaru roboczego sa dwoma widokami TEGO SAMEGO licznika — wczesniej stan
 * siedzial w `useState` wewnatrz `SidebarTracker`, wiec drugie miejsce nie
 * mialo do czego sie podpiac.
 *
 * Czas liczymy ze znacznika startu, nie z tykajacego licznika w store:
 * dzieki temu dwa zamontowane widoki nie inkrementuja go dwa razy, a przerwa
 * w dzialaniu zakladki nie gubi sekund.
 */
interface TimerState {
  running: boolean
  /** Sekundy zakumulowane w zakonczonych odcinkach. */
  baseSeconds: number
  /** Znacznik startu biezacego odcinka (ms) albo `null`, gdy licznik stoi. */
  startedAt: number | null
  start: () => void
  stop: () => void
  toggle: () => void
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  running: false,
  baseSeconds: 0,
  startedAt: null,

  start: () => {
    if (get().running) return
    set({ running: true, startedAt: Date.now() })
  },

  stop: () => {
    const { running, baseSeconds, startedAt } = get()
    if (!running || startedAt === null) return
    set({
      running: false,
      startedAt: null,
      baseSeconds: baseSeconds + Math.floor((Date.now() - startedAt) / 1000),
    })
  },

  toggle: () => (get().running ? get().stop() : get().start()),
}))

/**
 * Liczba sekund na liczniku, odswiezana co sekunde tylko gdy licznik leci.
 *
 * Na serwerze i przy pierwszym renderze klienta licznik stoi na `baseSeconds`,
 * wiec markup SSR i hydracja sa identyczne.
 */
export function useElapsedSeconds(): number {
  const running = useTimerStore((state) => state.running)
  const baseSeconds = useTimerStore((state) => state.baseSeconds)
  const startedAt = useTimerStore((state) => state.startedAt)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!running) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [running])

  if (!running || startedAt === null) return baseSeconds
  return baseSeconds + Math.max(0, Math.floor((now - startedAt) / 1000))
}
