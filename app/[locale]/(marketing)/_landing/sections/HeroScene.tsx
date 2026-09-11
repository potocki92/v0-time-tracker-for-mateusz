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
 * Hero: naglowek, jedno zdanie, dwa CTA i interfejs, ktory przejmuje ekran.
 *
 * Sekcja ma zrobic JEDNA rzecz: przewiniecie o pol ekranu ma sie czytac jak
 * WEJSCIE DO APLIKACJI. Copy spokojnie odplywa w gore, a urzadzenie rosnie i
 * dochodzi niemal do krawedzi viewportu — nie dlatego, ze zmienia sie jego
 * rozmiar (`width` w animacji to przeliczanie ukladu w kazdej klatce), tylko
 * dlatego, ze startuje odrobine mniejsze, niz jest naprawde.
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
 * DESKTOP dostaje CZTERY stopnie perspektywy, a nie dwanascie. Powod jest
 * kompozycyjny, nie wydajnosciowy: mocny `rotateX` czyta sie jako „zrzut
 * ekranu na podstawce", czyli jako ILUSTRACJA produktu. Kilka stopni robi co
 * innego — prostuje sie tak szybko, ze oko odbiera to jako dojscie kamery do
 * ekranu, a nie jako przechylona makiete. Reszte monumentalnosci niesie
 * SKALA: ramka jest fizycznie wieksza i podjezdza od 0,965 do 1,03.
 *
 * `rotateX` konczy sie w polowie toru (0,55), zeby przez cala druga polowe
 * uzytkownik patrzyl juz na plaski, „prawdziwy" interfejs.
 *
 * MOBILE nie ma `rotateX` w ogole. Powod jest twardy: `rotateX` na dziecku
 * rodzica z `perspective` zaklada dla calego poddrzewa kontekst renderowania
 * 3D, a w srodku stoi kompletna replika pulpitu. Kazda klatka przewijania to
 * wtedy rasteryzacja duzej warstwy w przestrzeni 3D — najdrozsza rzecz na tej
 * stronie, a na pieciocalowym ekranie perspektywy i tak prawie nie widac.
 */
const STAGE = {
  desktop: {
    input: [0, 0.55, 1],
    output: [
      'translateY(0px) scale(0.965) rotateX(4deg)',
      'translateY(-22px) scale(1.002) rotateX(0deg)',
      'translateY(-44px) scale(1.03) rotateX(0deg)',
    ],
    perspective: '2200px',
  },
  mobile: {
    input: [0, 1],
    output: ['translateY(0px) scale(0.985)', 'translateY(-18px) scale(1.02)'],
    perspective: undefined,
  },
} as const

export function HeroScene({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.hero')
  const profile = useMotionProfile()
  const ref = useRef<HTMLElement>(null)
  const progress = useExitProgress(ref)
  const stage = STAGE[profile]

  // Copy wychodzi WCZESNIEJ niz konczy sie tor i wolniej, niz rosnie ramka:
  // ma zniknac bez posrednictwa, zeby oko zostalo z interfejsem, a nie
  // sciagac uwagi szybkim ruchem w druga strone.
  const introOpacity = useTransform(progress, [0, 0.34], [1, 0])
  const introTransform = useScrollTransform(
    progress,
    [0, 0.55],
    ['translateY(0px)', 'translateY(-64px)'],
  )
  const stageTransform = useScrollTransform(progress, stage.input, stage.output)

  return (
    <section ref={ref} className="relative pt-28 sm:pt-32 lg:pt-36">
      <m.div
        className="lp-motion mx-auto max-w-[1400px] px-5 sm:px-8"
        style={{ opacity: introOpacity, transform: introTransform }}
      >
        <h1 className="lp-display lp-d1 max-w-[13ch]">
          {t('titleLine1')}
          <br />
          {t('titleLine2')}
        </h1>
        <p className="mt-7 max-w-[46ch] text-base leading-relaxed text-[var(--lp-ink-2)] sm:text-lg">
          {t('lead')}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
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
      <div className="mt-10 px-3 sm:mt-14 sm:px-6 lg:px-8" style={{ perspective: stage.perspective }}>
        <m.div
          className="lp-motion mx-auto max-w-[1800px]"
          style={{ transform: stageTransform, transformOrigin: 'top center' }}
        >
          {/*
            `svh`, nie `vh`: na iOS `vh` odnosi sie do viewportu BEZ paska
            Safari, wiec ramka bylaby wyzsza niz widoczny ekran, a kazde
            chowanie paska zmienialoby jej wysokosc w srodku ruchu palca.

            Na duzym ekranie ramka siega 76svh i niemal calej szerokosci —
            to ona jest bohaterem sekcji, a nie naglowek nad nia.
          */}
          <div className="h-[62svh] min-h-[400px] sm:h-[70svh] lg:h-[76svh]">
            <AppFrame active="dashboard" label={t('frameLabel')}>
              <DashboardScreen month={month} />
            </AppFrame>
          </div>
        </m.div>
      </div>
    </section>
  )
}
