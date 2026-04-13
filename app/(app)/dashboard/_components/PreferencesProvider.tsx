'use client'

/**
 * PreferencesProvider — hydratuje Zustand store danymi z Supabase
 * przy pierwszym mount (po zalogowaniu).
 *
 * Przepływ:
 * 1. Zustand odczytuje localStorage synchronicznie (persist middleware)
 *    → UI renderuje się natychmiast z ostatnio zapisanymi preferencjami
 * 2. Provider w tle pobiera aktualne dane z Supabase
 * 3. hydrate() nadpisuje store → jeśli coś się zmieniło na innym urządzeniu,
 *    UI się aktualizuje (jeden dodatkowy render)
 * 4. Dalej: każda zmiana zapisuje się lokalnie (Zustand) + sync do Supabase
 */

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePreferencesStore } from '../_hooks/usePreferencesStore'
import type { Currency, Goal } from '@/app/(app)/dashboard/_domain/dashboard.types'

interface PreferencesProviderProps {
  children: React.ReactNode
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const hydrate  = usePreferencesStore((s) => s.hydrate)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>

      // Mapowanie user_metadata → PreferencesStore
      const eurToPln = Number(meta.eur_to_pln)
      const goalAmount = Number(meta.goal_amount)

      hydrate({
        eurToPln:    Number.isFinite(eurToPln) && eurToPln > 0 ? eurToPln : undefined,
        useLiveRate: meta.use_live_rate !== false,
        goal: Number.isFinite(goalAmount) && goalAmount > 0
          ? {
              amount:   goalAmount,
              currency: (meta.goal_currency as Currency) ?? 'PLN',
            } satisfies Goal
          : null,
        displayCurrency: (meta.display_currency as Currency) ?? 'PLN',
      })
    })()
  }, [hydrate])

  return <>{children}</>
}

// ── Sync helper — wywołuj po zapisaniu preferencji ────────────────────────────

/**
 * Zapisuje preferencje do Supabase user_metadata.
 * Wywołuj fire-and-forget, nie blokuj UI.
 *
 * @example
 * const setGoal = usePreferencesStore(selectSetGoal)
 *
 * const handleSave = (goal: Goal) => {
 *   setGoal(goal)                    // ← natychmiastowy update w UI
 *   void syncPreferencesToSupabase() // ← async, w tle
 * }
 */
export async function syncPreferencesToSupabase(): Promise<void> {
  const state    = usePreferencesStore.getState()
  const supabase = createClient()

  await supabase.auth.updateUser({
    data: {
      eur_to_pln:       state.eurToPln,
      use_live_rate:    state.useLiveRate,
      goal_amount:      state.goal?.amount    ?? null,
      goal_currency:    state.goal?.currency  ?? null,
      display_currency: state.displayCurrency,
    },
  })
}