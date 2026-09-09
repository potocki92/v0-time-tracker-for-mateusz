'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { m } from 'framer-motion'

import type { DemoMonth } from '../_demo/demo-data'
import { useExitProgress, useScrollMap } from '../_motion/scene'
import { AppFrame } from '../_product/AppFrame'
import { DashboardScreen } from '../_product/screens/DashboardScreen'

/**
 * Hero: naglowek, jedno zdanie, dwa CTA i ogromny interfejs.
 *
 * Przewijanie pierwszego ekranu robi jedna rzecz: odsuwa tekst i przyblizając
 * dashboard prostuje jego perspektywe (rotateX 12° → 0°, scale 0.94 → 1.06).
 * Zludzenie 3D stoi na dwoch wlasciwosciach `transform` — bez WebGL, bez
 * biblioteki, bez ani jednego rerenderu.
 */
export function HeroScene({ month }: { month: DemoMonth }) {
  const ref = useRef<HTMLElement>(null)
  const progress = useExitProgress(ref)

  const introOpacity = useScrollMap(progress, [0, 0.42], [1, 0])
  const introY = useScrollMap(progress, [0, 0.6], [0, -90])
  const stageScale = useScrollMap(progress, [0, 1], [0.94, 1.06])
  const stageRotate = useScrollMap(progress, [0, 0.75], [12, 0])
  const stageY = useScrollMap(progress, [0, 1], [0, -70])

  return (
    <section ref={ref} className="relative pt-28 sm:pt-32">
      <m.div
        className="lv2-motion mx-auto max-w-[1400px] px-5 sm:px-8"
        style={{ opacity: introOpacity, y: introY }}
      >
        <h1 className="lv2-display lv2-d1 max-w-[14ch]">
          Every hour.
          <br />
          Accounted for.
        </h1>
        <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--lv2-ink-2)] sm:text-lg">
          TimeTracker records the days you actually work, turns them into an invoice, and shows
          what the month was worth.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="lv2-cta">
            Open app
          </Link>
          <a href="#product" className="lv2-cta-ghost">
            See how it works
          </a>
        </div>
      </m.div>

      {/* Perspektywa siedzi na rodzicu, zeby dziecko animowalo sam `rotateX`. */}
      <div className="mt-12 px-2 sm:mt-16 sm:px-6" style={{ perspective: '1600px' }}>
        <m.div
          className="lv2-motion mx-auto max-w-[1560px]"
          style={{ scale: stageScale, rotateX: stageRotate, y: stageY, transformOrigin: 'top center' }}
        >
          <div className="h-[58vh] min-h-[380px] sm:h-[64vh]">
            <AppFrame active="dashboard" label="Pulpit aplikacji TimeTracker: godziny tygodnia, zarobki, wykres, projekty i faktury">
              <DashboardScreen month={month} />
            </AppFrame>
          </div>
        </m.div>
      </div>
    </section>
  )
}
