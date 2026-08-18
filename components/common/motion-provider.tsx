'use client'

import { LazyMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Laduje tylko animacje DOM (domAnimation), i to leniwie.
 *
 * Umieszczaj go NAD poddrzewem, ktore animuje — nigdy w root layoucie.
 * Zmierzone: w rootcie shell LazyMotion dodaje ~11,4 kB gzip takze do tras
 * bez zadnej animacji, co zjada caly zysk.
 */
const loadDomAnimation = () => import('framer-motion').then((mod) => mod.domAnimation)

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadDomAnimation} strict>
      {children}
    </LazyMotion>
  )
}
