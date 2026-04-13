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
import { DEFAULT_EUR_TO_PLN } from '@/app/(app)/dashboard/_domain/dashboard.constants'
import type { Currency, Goal } from '@/app/(app)/dashboard/_domain/dashboard.types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  /** Kurs EUR→PLN — override live rate gdy ustawiony */
  eurToPln:         number
  /** Czy używać live rate zamiast własnego */
  useLiveRate:      boolean
  /** Cel miesięczny */
  goal:             Goal | null
  /** Domyślna waluta wyświetlania */
  displayCurrency:  Currency
}

interface PreferencesActions {
  setEurToPln:        (rate: number) => void
  toggleLiveRate:     () => void
  setGoal:            (goal: Goal | null) => void
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
      partialize: (state): UserPreferences => ({
        eurToPln:        state.eurToPln,
        useLiveRate:     state.useLiveRate,
        goal:            state.goal,
        displayCurrency: state.displayCurrency,
      }),
    },
  ),
)

// ── Selektory ─────────────────────────────────────────────────────────────────
// Wyciągaj konkretne pola przez selektory — komponent rerenderuje się tylko
// gdy TO pole się zmienia, nie gdy zmieni się cokolwiek w storze.

export const selectEurRate          = (s: PreferencesStore) => s.eurToPln
export const selectGoal             = (s: PreferencesStore) => s.goal
export const selectDisplayCurrency  = (s: PreferencesStore) => s.displayCurrency
export const selectUseliverate      = (s: PreferencesStore) => s.useLiveRate
export const selectSetGoal          = (s: PreferencesStore) => s.setGoal
export const selectSetEurToPln      = (s: PreferencesStore) => s.setEurToPln

// ── Convenience hooks ─────────────────────────────────────────────────────────

/** Zwraca efektywny kurs: live (z props) albo własny z preferencji */
export function useEffectiveEurRate(liveRate: number | null): number {
  const { eurToPln, useLiveRate } = usePreferencesStore((s) => ({
    eurToPln:    s.eurToPln,
    useLiveRate: s.useLiveRate,
  }))
  if (useLiveRate && liveRate !== null) return liveRate
  return eurToPln
}