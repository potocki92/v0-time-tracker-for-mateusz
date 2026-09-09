'use client'

import { useRef } from 'react'
import { m, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import type { DemoMonth } from '../demo/demo-data'
import { useMotionProfile } from '../motion/profile'
import { useExitProgress, useScrollTransform } from '../motion/scene'
import { AppFrame } from '../product/AppFrame'
import { DashboardScreen } from '../product/screens/DashboardScreen'

/**
 * Hero: naglowek, jedno zdanie, dwa CTA i ogromny interfejs.
 *
 * Przewijanie pierwszego ekranu robi jedna rzecz: odsuwa tekst i przyblizajac
 * dashboard prostuje jego perspektywe. Zludzenie 3D stoi na `transform` —
 * bez WebGL, bez biblioteki, bez ani jednego rerenderu.
 *
 * Caly transform sceny jedzie jako JEDEN string zamiast trzech osobnych
 * skladowych (`scale`, `rotateX`, `y`). To nie jest kosmetyka: tylko w tej
 * formie Motion oddaje animacje przegladarce (patrz `../motion/scene`).
 * Trzy skladowe to trzy zapisy stylu w kazdej klatce przewijania, jeden
 * string to zero.
 */

/**
 * Profile ruchu sceny hero.
 *
 * DESKTOP zostaje widowiskowy: 12 stopni perspektywy i 12 procent skali na
 * calej wysokosci ekranu.
 *
 * MOBILE nie ma `rotateX` w ogole. Powod jest twardy: `rotateX` na dziecku
 * rodzica z `perspective` zaklada dla calego poddrzewa kontekst renderowania
 * 3D, a w srodku stoi kompletna replika pulpitu. Kazda klatka przewijania to
 * wtedy rasteryzacja duzej warstwy w przestrzeni 3D — najdrozsza rzecz na tej
 * stronie, a na pieciocalowym ekranie perspektywy i tak prawie nie widac.
 * Zostaje delikatne przyblizenie i przesuniecie, ktore czyta sie jako
 * „interfejs wychodzi do przodu".
 */
const STAGE = {
  desktop: {
    // Trzy klatki, bo `rotateX` konczy sie wczesniej (0,75) niz skala i
    // przesuniecie (1,0) — wartosci posrednie sa dokladnie takie, jakie
    // dalyby trzy osobne przebiegi liniowe.
    input: [0, 0.75, 1],
    output: [
      'translateY(0px) scale(0.94) rotateX(12deg)',
      'translateY(-52.5px) scale(1.03) rotateX(0deg)',
      'translateY(-70px) scale(1.06) rotateX(0deg)',
    ],
    perspective: '1600px',
  },
  mobile: {
    input: [0, 1],
    output: ['translateY(0px) scale(0.98)', 'translateY(-24px) scale(1.02)'],
    perspective: undefined,
  },
} as const

export function HeroScene({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.hero')
  const profile = useMotionProfile()
  const ref = useRef<HTMLElement>(null)
  const progress = useExitProgress(ref)
  const stage = STAGE[profile]

  const introOpacity = useTransform(progress, [0, 0.42], [1, 0])
  const introTransform = useScrollTransform(
    progress,
    [0, 0.6],
    ['translateY(0px)', 'translateY(-90px)'],
  )
  const stageTransform = useScrollTransform(progress, stage.input, stage.output)

  return (
    <section ref={ref} className="relative pt-28 sm:pt-32">
      <m.div
        className="lp-motion mx-auto max-w-[1400px] px-5 sm:px-8"
        style={{ opacity: introOpacity, transform: introTransform }}
      >
        <h1 className="lp-display lp-d1 max-w-[14ch]">
          {t('titleLine1')}
          <br />
          {t('titleLine2')}
        </h1>
        <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--lp-ink-2)] sm:text-lg">
          {t('lead')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="lp-cta">
            {t('ctaPrimary')}
          </Link>
          <a href="#product" className="lp-cta-ghost">
            {t('ctaSecondary')}
          </a>
        </div>
      </m.div>

      {/* Perspektywa siedzi na rodzicu, zeby dziecko animowalo sam `rotateX`.
          Na telefonie nie ma jej wcale — nie ma czego rzutowac. */}
      <div className="mt-12 px-2 sm:mt-16 sm:px-6" style={{ perspective: stage.perspective }}>
        <m.div
          className="lp-motion mx-auto max-w-[1560px]"
          style={{ transform: stageTransform, transformOrigin: 'top center' }}
        >
          <div className="h-[58vh] min-h-[380px] sm:h-[64vh]">
            <AppFrame active="dashboard" label={t('frameLabel')}>
              <DashboardScreen month={month} />
            </AppFrame>
          </div>
        </m.div>
      </div>
    </section>
  )
}
