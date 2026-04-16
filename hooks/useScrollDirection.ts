'use client'

/**
 * useScrollDirection
 *
 * Wykrywa kierunek scrollowania z progiem prędkości.
 * Próg zapobiega przypadkowemu chowaniu headera przy mikroskopijnych ruchach.
 *
 * Zwraca:
 *  - direction: 'up' | 'down' | 'idle'
 *  - scrollY:   aktualny scrollY (do efektu tła headera)
 *  - isAtTop:   czy jesteśmy na samej górze strony
 */

import { useEffect, useRef, useState } from 'react'

export type ScrollDirection = 'up' | 'down' | 'idle'

interface UseScrollDirectionOptions {
  /**
   * Minimalna różnica w px między poprzednim a aktualnym scrollY
   * żeby zmienić kierunek. Zapobiega flicker przy drobnych ruchach.
   * Default: 8
   */
  threshold?: number
  /**
   * ScrollY od góry poniżej którego header zawsze jest widoczny.
   * Default: 80
   */
  topOffset?: number
}

interface UseScrollDirectionReturn {
  direction: ScrollDirection
  scrollY:   number
  isAtTop:   boolean
}

export function useScrollDirection({
  threshold = 8,
  topOffset = 80,
}: UseScrollDirectionOptions = {}): UseScrollDirectionReturn {
  const [direction, setDirection] = useState<ScrollDirection>('idle')
  const [scrollY,   setScrollY]   = useState(0)
  const [isAtTop,   setIsAtTop]   = useState(true)

  // useRef zamiast state dla poprzedniej pozycji — nie potrzebujemy re-renderu
  const prevScrollY = useRef(0)
  // Timestamp poprzedniego update — throttle przez requestAnimationFrame
  const ticking     = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return

      ticking.current = true
      requestAnimationFrame(() => {
        const current = window.scrollY
        const delta   = current - prevScrollY.current

        setScrollY(current)
        setIsAtTop(current < topOffset)

        // Zmień kierunek tylko przy przekroczeniu progu
        if (Math.abs(delta) >= threshold) {
          setDirection(delta > 0 ? 'down' : 'up')
          prevScrollY.current = current
        }

        ticking.current = false
      })
    }

    // Passive: true — przeglądarka nie czeka na preventDefault() → płynniejszy scroll
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Ustaw początkowy stan
    prevScrollY.current = window.scrollY
    setScrollY(window.scrollY)
    setIsAtTop(window.scrollY < topOffset)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold, topOffset])

  return { direction, scrollY, isAtTop }
}