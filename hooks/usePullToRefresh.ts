'use client'

/**
 * #13 — Pull-to-refresh na mobile
 *
 * Plik: src/hooks/usePullToRefresh.ts
 *
 * Czysty hook bez zależności od bibliotek.
 * Działa na touch events (mobile) i mouse events (dev/desktop).
 *
 * Użycie:
 *   const { isPulling, pullProgress, isRefreshing } = usePullToRefresh({
 *     onRefresh: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
 *   })
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  /** Callback wywoływany gdy user puści po przekroczeniu progu */
  onRefresh:       () => Promise<void> | void
  /** Próg w px po którym następuje refresh (default: 80) */
  threshold?:      number
  /** Element który może być pullowany (default: window) */
  containerRef?:   React.RefObject<HTMLElement>
  /** Czy hook jest aktywny (np. wyłącz gdy modal otwarty) */
  enabled?:        boolean
}

interface UsePullToRefreshReturn {
  /** Czy user aktualnie ciągnie */
  isPulling:      boolean
  /** 0–1: ile progu zostało pokonane (do animacji wskaźnika) */
  pullProgress:   number
  /** Czy trwa refresh (onRefresh jeszcze nie rozwiązany) */
  isRefreshing:   boolean
  /** translateY w px do animacji kontenera */
  pullDistance:   number
}

const THRESHOLD         = 80   // px — ile trzeba pociągnąć
const MAX_PULL_DISTANCE = 120  // px — maksymalne przesunięcie (rubber band)
const RESISTANCE        = 0.4  // spowalnia pull po przekroczeniu threshold

export function usePullToRefresh({
  onRefresh,
  threshold    = THRESHOLD,
  containerRef,
  enabled      = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling,    setIsPulling]    = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const startY      = useRef(0)
  const currentY    = useRef(0)
  const isDragging  = useRef(false)

  // Sprawdza czy element jest na górze scrollowania
  const isAtTop = useCallback((): boolean => {
    const el = containerRef?.current
    if (el) return el.scrollTop === 0
    return window.scrollY === 0
  }, [containerRef])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return
    if (!isAtTop()) return

    startY.current   = e.touches[0].clientY
    isDragging.current = false
  }, [enabled, isRefreshing, isAtTop])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return
    if (!isAtTop() && !isDragging.current) return

    currentY.current = e.touches[0].clientY
    const delta = currentY.current - startY.current

    if (delta <= 0) {
      setPullDistance(0)
      setIsPulling(false)
      isDragging.current = false
      return
    }

    isDragging.current = true

    // Rubber band: po przekroczeniu threshold pull spowalnia
    const distance = delta < threshold
      ? delta
      : threshold + (delta - threshold) * RESISTANCE

    const clamped = Math.min(distance, MAX_PULL_DISTANCE)
    setPullDistance(clamped)
    setIsPulling(true)

    // Zapobiegaj natywnym scrollowi podczas pullowania
    if (delta > 5) e.preventDefault()
  }, [enabled, isRefreshing, isAtTop, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return

    const distance = currentY.current - startY.current
    isDragging.current = false

    if (distance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(40) // zostaw trochę miejsca na spinner

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }

    // Animacja powrotu
    setPullDistance(0)
    setIsPulling(false)
  }, [threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const target = containerRef?.current ?? window

    // passive: false umożliwia preventDefault() w touchmove
    target.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true })
    target.addEventListener('touchmove',  handleTouchMove  as EventListener, { passive: false })
    target.addEventListener('touchend',   handleTouchEnd   as EventListener, { passive: true })

    return () => {
      target.removeEventListener('touchstart', handleTouchStart as EventListener)
      target.removeEventListener('touchmove',  handleTouchMove  as EventListener)
      target.removeEventListener('touchend',   handleTouchEnd   as EventListener)
    }
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd])

  const pullProgress = Math.min(pullDistance / threshold, 1)

  return { isPulling, pullProgress, isRefreshing, pullDistance }
}