/**
 * #7 — Zustand dla globalnych preferencji użytkownika
 *
 * Problem: preferencje (kurs EUR, cel miesięczny, waluta) są trzymane
 * w Supabase `user_metadata`. Każda zmiana wymaga round-tripu do Supabase
 * i przeładowania całego dashboardu. Brak lokalnego optimistic update.
 *
 * Rozwiązanie: Zustand + persist middleware
 *  • Preferencje dostępne synchronicznie — zero loading state
 *  • Persist do localStorage — przeżywa odświeżenie strony
 *  • Sync z Supabase w tle (fire-and-forget) — nie blokuje UI
 *  • Jeden store, wiele selektorów — zero prop drillingu
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { DEFAULT_EUR_TO_PLN } from '@/features/dashboard/types/dashboard.constants'
import type { Currency, Goal } from '@/features/dashboard/types/dashboard.types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  /** Kurs EUR→PLN — override live rate gdy ustawiony */
  eurToPln:         number
  /** Czy używać live rate zamiast własnego */
  useLiveRate:      boolean
  liveEurRate:     number | null
  /** Cel miesięczny */
  goal:             Goal | null
  /** Domyślna waluta wyświetlania */
  displayCurrency:  Currency
}

interface PreferencesActions {
  setEurToPln:        (rate: number) => void
  toggleLiveRate:     () => void
  setLiveRate:        (rate: number | null) => void
  setGoal:         (goal: Goal | null) => void
  setDisplayCurrency: (currency: Currency) => void
  /** Nadpisuje cały store danymi z Supabase (wywoływane raz przy mount) */
  hydrate:            (partial: Partial<UserPreferences>) => void
  /** Reset do wartości domyślnych */
  reset:              () => void
}

export type PreferencesStore = UserPreferences & PreferencesActions

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULTS: UserPreferences = {
  eurToPln:        DEFAULT_EUR_TO_PLN,
  useLiveRate:     true,
  liveEurRate: null,
  goal:            null,
  displayCurrency: 'PLN',
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    immer((set) => ({
      ...DEFAULTS,

      setEurToPln: (rate) =>
        set((s) => {
          s.eurToPln    = rate
          s.useLiveRate = false  // własny kurs → wyłącz live
        }),

      toggleLiveRate: () =>
        set((s) => {
          s.useLiveRate = !s.useLiveRate
        }),

      setLiveRate: (rate: number | null) =>
          set((s) => { s.liveEurRate = rate }),

      setGoal: (goal) =>
        set((s) => { s.goal = goal }),

      setDisplayCurrency: (currency) =>
        set((s) => { s.displayCurrency = currency }),

      hydrate: (partial) =>
        set((s) => {
          // hydrate tylko pola które Supabase faktycznie zwrócił
          if (partial.eurToPln    !== undefined) s.eurToPln    = partial.eurToPln
          if (partial.goal        !== undefined) s.goal        = partial.goal
          if (partial.useLiveRate !== undefined) s.useLiveRate = partial.useLiveRate
          if (partial.displayCurrency !== undefined) s.displayCurrency = partial.displayCurrency
        }),

      reset: () => set(() => ({ ...DEFAULTS })),
    })),

    {
      name:    'user-preferences',           // klucz w localStorage
      storage: createJSONStorage(() => localStorage),
      // Serializujemy tylko preferencje, nie akcje
      partialize: (state) => ({
        eurToPln:        state.eurToPln,
        useLiveRate:     state.useLiveRate,
        liveEurRate:     state.liveEurRate,
        goal:            state.goal,
        displayCurrency: state.displayCurrency,
      }),
    },
  ),
)

import { useShallow } from 'zustand/react/shallow'

// ── Selektory (do użycia z usePreferencesStore(selector)) ───────────────────
export const selectEurRate = (s: PreferencesStore): number => {
  if (s.useLiveRate && s.liveEurRate !== null) return s.liveEurRate
  return s.eurToPln
}
export const selectGoal = (s: PreferencesStore): Goal | null => s.goal

// ── Selektory atomowe (preferowane) ──────────────────────────────────────────
export const useEurToPln        = () => usePreferencesStore((s) => s.eurToPln)
export const useUseLiveRate     = () => usePreferencesStore((s) => s.useLiveRate)
export const useLiveEurRate     = () => usePreferencesStore((s) => s.liveEurRate)
export const useGoal            = () => usePreferencesStore((s) => s.goal)
export const useDisplayCurrency = () => usePreferencesStore((s) => s.displayCurrency)

// Akcje są stabilne (Zustand nie rerenderuje)
export const useSetEurToPln     = () => usePreferencesStore((s) => s.setEurToPln)
export const useSetGoal         = () => usePreferencesStore((s) => s.setGoal)
export const useToggleLiveRate  = () => usePreferencesStore((s) => s.toggleLiveRate)

// Convenience hook — ZAWSZE z useShallow gdy zwracasz obiekt
export function useEffectiveEurRate(): number {
  const { eurToPln, useLiveRate, liveEurRate } = usePreferencesStore(
    useShallow((s) => ({ eurToPln: s.eurToPln, useLiveRate: s.useLiveRate, liveEurRate: s.liveEurRate })),
  )
  if (useLiveRate && liveEurRate !== null) return liveEurRate
  return eurToPln
}
