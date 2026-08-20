'use client'

/**
 * Unified client-side logout pipeline.
 *
 *  1. Globally invalidate Supabase session (`scope: 'global'`) — odwołuje
 *     refresh token, więc inne urządzenia/karty również wylatują.
 *  2. Reset Zustand stores + wyczyść ich `persist` (localStorage / sessionStorage).
 *  3. Skasuj cache React Query (zapobiega wyświetleniu danych poprzedniego usera
 *     przy szybkim re-login).
 *  4. Defensywne czyszczenie kluczy `sb-*` z localStorage (na wypadek SDK quirks).
 *  5. Twardy redirect na /auth/login — pełny request, świeży middleware,
 *     czyste cookies, brak resztek in-memory state.
 */

import type { QueryClient } from '@tanstack/react-query'

import { signOutAction } from '@/lib/auth/actions'
import { usePreferencesStore } from '@/features/dashboard'
import { useUiStore } from '@/hooks/stores/useUiStore'

const LOGIN_PATH = '/auth/login'

const PERSISTED_STORE_KEYS = ['user-preferences', 'ui-state'] as const

export async function performLogout(queryClient?: QueryClient): Promise<void> {
  // 1. Server-side session invalidation. `global` revokes the refresh token.
  try {
    await signOutAction()
  } catch {
    // Offline / już wygasła – nie blokujemy lokalnego cleanupu.
  }

  // 2. Zustand reset + persist clear
  try {
    usePreferencesStore.getState().reset()
    usePreferencesStore.persist.clearStorage()
    useUiStore.persist.clearStorage()
  } catch {
    /* noop */
  }

  // 3. React Query – pełny wipe
  try {
    queryClient?.clear()
  } catch {
    /* noop */
  }

  // 4. Defence in depth – sb-* + nasze klucze
  if (typeof window !== 'undefined') {
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('sb-') || (PERSISTED_STORE_KEYS as readonly string[]).includes(key)) {
          window.localStorage.removeItem(key)
        }
      }
      for (const key of PERSISTED_STORE_KEYS) {
        window.sessionStorage.removeItem(key)
      }
    } catch {
      /* noop */
    }

    // 5. Hard navigation – middleware zobaczy puste cookies, brak race conditions.
    window.location.replace(LOGIN_PATH)
  }
}
