'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { PREFETCH_REGISTRY } from './prefetchRegistry'

/**
 * Ile ms kursor musi zostac na linku, zanim uznamy to za zamiar nawigacji.
 * Bez tego przejazd myszka przez sidebar odpala zapytanie za kazdym linkiem
 * po drodze — piec sekcji to piec niepotrzebnych round-tripow do Supabase.
 */
const HOVER_INTENT_MS = 120

/**
 * Pobiera dane trasy na zamiar nawigacji.
 *
 * Hover dostaje opoznienie (przypadkowy przejazd myszka to nie zamiar),
 * fokus klawiatura nie — dojscie Tabem do linku jest jednoznaczne.
 * Trasa, na ktorej juz jestes, jest pomijana.
 */
export function usePrefetchRoute() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelIntent = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  useEffect(() => cancelIntent, [cancelIntent])

  const run = useCallback(
    async (href: string): Promise<void> => {
      const entry = PREFETCH_REGISTRY[href]
      if (!entry) return
      // prefetchQuery jest no-opem, gdy wpis jest jeszcze swiezy —
      // nie musimy sami pilnowac staleTime.
      await queryClient.prefetchQuery({
        queryKey: entry.queryKey,
        queryFn: entry.queryFn,
        staleTime: entry.staleTime,
      })
    },
    [queryClient],
  )

  const onHoverIntent = useCallback(
    (href: string) => () => {
      if (href === pathname || !PREFETCH_REGISTRY[href]) return
      cancelIntent()
      timer.current = setTimeout(() => void run(href), HOVER_INTENT_MS)
    },
    [pathname, cancelIntent, run],
  )

  const onFocusIntent = useCallback(
    (href: string) => () => {
      if (href === pathname || !PREFETCH_REGISTRY[href]) return
      void run(href)
    },
    [pathname, run],
  )

  return { onHoverIntent, onFocusIntent, cancelIntent }
}
