'use client'

/**
 * useLogoScroll
 *
 * Mapuje pozycję scrolla na wartości wizualne napisu w logo.
 *
 * scrollY 0   → scale 1.0, opacity 1, width pełna, blur 0
 * scrollY end → scale 0.7, opacity 0, width 0,     blur 4px
 *
 * useTransform z Framer Motion oblicza wartości bezpośrednio
 * na warstwie animacji (nie w React render loop) — zero re-renderów.
 */

import { useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'

interface UseLogoScrollOptions {
  /**
   * ScrollY przy którym animacja zaczyna się.
   * Default: 0 (od razu)
   */
  scrollStart?: number
  /**
   * ScrollY przy którym tekst jest całkowicie niewidoczny.
   * Default: 120
   */
  scrollEnd?: number
}

interface UseLogoScrollReturn {
  /** 1 → 0: przezroczystość tekstu */
  opacity:    MotionValue<number>
  /** 1 → 0.7: skala tekstu */
  scale:      MotionValue<number>
  /** '100%' → '0%': szerokość kontenera tekstu (collapse bez layout shift) */
  maxWidth:   MotionValue<string>
  /** 1 → 0: opacity wrappera (dla margin/padding collapse) */
  gapOpacity: MotionValue<number>
}

export function useLogoScroll({
  scrollStart = 0,
  scrollEnd   = 120,
}: UseLogoScrollOptions = {}): UseLogoScrollReturn {
  const { scrollY } = useScroll()

  // Surowe wartości z transformacji scrollY
  const rawOpacity  = useTransform(scrollY, [scrollStart, scrollEnd], [1, 0])
  const rawScale    = useTransform(scrollY, [scrollStart, scrollEnd], [1, 0.75])
  const rawMaxWidth = useTransform(scrollY, [scrollStart, scrollEnd * 0.8], ['200px', '0px'])
  const rawGap      = useTransform(scrollY, [scrollStart, scrollEnd * 0.6], [1, 0])

  // Spring wygładza wartości — eliminuje "skokowy" efekt przy szybkim scrollu
  const opacity  = useSpring(rawOpacity,  { stiffness: 200, damping: 30, mass: 0.5 })
  const scale    = useSpring(rawScale,    { stiffness: 200, damping: 30, mass: 0.5 })
  const maxWidth = rawMaxWidth  // maxWidth nie springujemy — spring na string nie działa
  const gapOpacity = useSpring(rawGap,   { stiffness: 200, damping: 30, mass: 0.5 })

  return { opacity, scale, maxWidth, gapOpacity }
}