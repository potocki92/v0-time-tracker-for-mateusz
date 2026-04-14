'use client'

/**
 * Logo.tsx — animacja napisu zsynchronizowana ze scrollem.
 *
 * Efekt jak na filmiku:
 * - Przy scrollY 0:   "TimeTracker" w pełnej skali i widoczności
 * - Przy scrollY 120: tekst znika (scale 0.75 + opacity 0 + szerokość zwinięta)
 * - Ikona zostaje zawsze widoczna
 *
 * Kluczowe decyzje techniczne:
 * - useTransform zamiast useEffect+useState → zero re-renderów React podczas scrolla
 * - maxWidth collapse zamiast display:none → płynne zwężenie bez layout shift
 * - overflow:hidden na wrapperze tekstu → tekst nie "wychodzi" podczas zwężania
 * - transform-origin: left → tekst kurczy się od lewej strony (jak na filmiku)
 */

import Link   from 'next/link'
import Image  from 'next/image'
import { motion } from 'framer-motion'
import { useLogoScroll } from '../../hooks'

export function Logo() {
  const { opacity, scale, maxWidth, gapOpacity } = useLogoScroll({
    scrollStart: 0,
    scrollEnd:   120,
  })

  return (
    <Link
      href="/dashboard"
      className="flex items-center shrink-0"
      aria-label="TimeTracker — strona główna"
    >
      {/* Ikona — zawsze widoczna, bez animacji scrollu */}
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        priority
        className="object-contain"
      />

      {/*
       * Gap między ikoną a tekstem — zmniejsza się gdy tekst znika.
       * Bez tego zostaje pusty odstęp po prawej ikony.
       */}
      <motion.div style={{ width: 8, opacity: gapOpacity }} />

      {/*
       * Wrapper tekstu z maxWidth collapse.
       * overflow:hidden niezbędne — bez tego tekst wystaje podczas zwężania.
       * will-change:transform,opacity — GPU hint dla płynnej animacji.
       */}
      <motion.div
        style={{
          maxWidth,
          overflow:    'hidden',
          willChange:  'transform, opacity',
          // transform-origin: left → tekst kurczy się do lewej, nie do centrum
          transformOrigin: 'left center',
        }}
      >
        <motion.span
          style={{
            opacity,
            scale,
            display:         'block',
            whiteSpace:      'nowrap',
            transformOrigin: 'left center',
          }}
          className="text-lg font-semibold tracking-tight"
          // aria-hidden bo Link ma aria-label z pełną nazwą
          aria-hidden="true"
        >
          TimeTracker
        </motion.span>
      </motion.div>
    </Link>
  )
}