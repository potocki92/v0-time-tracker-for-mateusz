'use client'

import { LazyMotion, MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Laduje tylko animacje DOM (domAnimation), i to leniwie.
 *
 * Umieszczaj go NAD poddrzewem, ktore animuje — nigdy w root layoucie.
 * Zmierzone: w rootcie shell LazyMotion dodaje ~11,4 kB gzip takze do tras
 * bez zadnej animacji, co zjada caly zysk.
 *
 * ── Dlaczego nadal `framer-motion`, a nie `motion/react` ──
 *
 * To ta sama biblioteka: pakiet `motion` eksportuje `./react` jako
 * `export * from 'framer-motion'`. Ten jeden przeskok przez re-eksport
 * wystarcza jednak, zeby webpack Nexta przestal shakowac ten graf: chunk
 * `LazyMotion` przestaje byc leniwy i domMax razem z projekcja laduja w
 * pierwszym ladowaniu KAZDEJ trasy uzywajacej Motion. Zmierzone na tym
 * repo: +45 kB gzip na landing, auth, klientow i faktury; przez
 * `framer-motion` — 0 kB. `optimizePackageImports` tego nie naprawia.
 *
 * Migracja dotyczyla wiec WERSJI, nie nazwy pakietu: 12.38 → 13.2.0.
 * Wersja ma znaczenie, bo dopiero 12.39 naprawia `useScroll` z `target`, na
 * czym stoi cala akceleracja sprzetowa scen landingu (patrz
 * `app/[locale]/(marketing)/_landing/motion/scene.ts`).
 */
const loadDomAnimation = () => import('framer-motion').then((mod) => mod.domAnimation)

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadDomAnimation} strict>
      {/* reducedMotion="user" respektuje ustawienie systemowe dla calego poddrzewa,
        * wiec pojedyncze komponenty nie musza o tym pamietac. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
