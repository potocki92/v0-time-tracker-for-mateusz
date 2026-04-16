'use client'

/**
 * useHeaderVisibility
 *
 * Przekształca kierunek scrollu w decyzję: czy header jest widoczny.
 *
 * Reguły:
 * - Zawsze widoczny gdy jesteśmy na górze strony (isAtTop)
 * - Zawsze widoczny gdy modal/drawer jest otwarty (locked)
 * - Chowa się przy scroll down
 * - Pojawia się przy scroll up
 *
 * Oddzielony od useScrollDirection żeby można go było łatwo
 * rozszerzyć o dodatkowe reguły (np. focus management, a11y).
 */

import { useEffect, useState } from 'react'
import { useScrollDirection } from './useScrollDirection'

interface UseHeaderVisibilityOptions {
  /** Minimalny scrollY żeby header mógł się schować. Default: 120 */
  hideThreshold?: number
  /** Czy header jest zablokowany w pozycji widocznej (np. otwarty menu) */
  locked?: boolean
}

interface UseHeaderVisibilityReturn {
  isVisible: boolean
  isAtTop:   boolean
  scrollY:   number
}

export function useHeaderVisibility({
  hideThreshold = 120,
  locked        = false,
}: UseHeaderVisibilityOptions = {}): UseHeaderVisibilityReturn {
  const { direction, scrollY, isAtTop } = useScrollDirection({ topOffset: hideThreshold })
  const [isVisible, setIsVisible]       = useState(true)

  useEffect(() => {
    // Zawsze widoczny gdy zablokowany lub na górze
    if (locked || isAtTop) {
      setIsVisible(true)
      return
    }

    if (direction === 'down') setIsVisible(false)
    if (direction === 'up')   setIsVisible(true)
  }, [direction, isAtTop, locked])

  return { isVisible, isAtTop, scrollY }
}