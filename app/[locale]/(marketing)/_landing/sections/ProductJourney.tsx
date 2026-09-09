'use client'

import { useRef, type ReactNode } from 'react'
import { m, useReducedMotion, type MotionValue } from 'framer-motion'

import { useTranslations } from 'next-intl'

import type { WorkspaceSegment } from '@/lib/workspace/sections'

import type { DemoMonth } from '../demo/demo-data'
import { useLayerFade, useTrackProgress } from '../motion/scene'
import { AppFrame } from '../product/AppFrame'
import { MARKETING_SECTIONS } from '../product/nav'
import { CalendarScreen } from '../product/screens/CalendarScreen'
import { DashboardScreen } from '../product/screens/DashboardScreen'
import { InvoiceScreen } from '../product/screens/InvoiceScreen'
import { ProjectsScreen } from '../product/screens/ProjectsScreen'
import { ReportsScreen } from '../product/screens/ReportsScreen'

/**
 * Sticky product journey — piec scen na jednym, nieruchomym interfejsie.
 *
 * Chrome (sidebar, naglowek, dolny pasek) renderuje sie RAZ i nie znika
 * miedzy scenami; przewijanie zmienia wylacznie warstwe tresci, podswietlona
 * pozycje w sidebarze i breadcrumb. Dzieki temu przejscie Pulpit → Kalendarz
 * czyta sie jak nawigacja w aplikacji, a nie jak przelaczanie zrzutow ekranu.
 *
 * `prefers-reduced-motion` dostaje osobne drzewo (`JourneyStatic`): te same
 * sceny jedna pod druga, kazda z wlasnym interfejsem. Fallback musi rozniac
 * sie DOM-em, bo pieciu nalozonych warstw nie da sie rozsunac sama zmiana CSS.
 */

interface Scene {
  index: string
  segment: WorkspaceSegment
  /**
   * Sekcje podswietlone w sidebarze. Tablica, bo scena moze objac wiecej niz
   * jedna pozycje — wszystkie musza byc widoczne w `MARKETING_SECTIONS`,
   * inaczej podswietlenie nie ma czego zapalic.
   */
  highlights: readonly WorkspaceSegment[]
  /**
   * Klucz tresci sceny w `marketing.journey.scenes.<key>` (title / body /
   * label). Copy nie mieszka w komponencie — jeden komponent, trzy jezyki.
   */
  copyKey: string
}

const SCENES: readonly Scene[] = [
  { index: '01', segment: 'dashboard', highlights: ['dashboard'], copyKey: 'dashboard' },
  { index: '02', segment: 'calendar', highlights: ['calendar'], copyKey: 'calendar' },
  // Ekran pokazuje projekty RAZEM z klientami, ale to jedna scena i jedna
  // pozycja nawigacji — powod stoi w `../product/nav`.
  { index: '03', segment: 'projects', highlights: ['projects'], copyKey: 'projects' },
  { index: '04', segment: 'invoices', highlights: ['invoices'], copyKey: 'invoices' },
  { index: '05', segment: 'reports', highlights: ['reports'], copyKey: 'reports' },
]

function screenFor(index: number, month: DemoMonth): ReactNode {
  switch (index) {
    case 0:
      return <DashboardScreen month={month} />
    case 1:
      return <CalendarScreen month={month} />
    case 2:
      return <ProjectsScreen />
    case 3:
      return <InvoiceScreen month={month} />
    default:
      return <ReportsScreen month={month} />
  }
}

export function ProductJourney({ month }: { month: DemoMonth }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <JourneyStatic month={month} />
  return <JourneySticky month={month} />
}

/* ─────────────────────────────── sticky ─────────────────────────────── */

function JourneySticky({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.journey')
  const trackRef = useRef<HTMLDivElement>(null)
  const progress = useTrackProgress(trackRef)

  // Piec jawnych wywolan zamiast petli: hooki musza byc bezwarunkowe, a scen
  // jest stala piatka. Okna sasiaduja z zakladka rowna czasowi przenikania.
  const fade0 = useLayerFade(progress, 0.0, 0.14)
  const fade1 = useLayerFade(progress, 0.21, 0.35)
  const fade2 = useLayerFade(progress, 0.42, 0.56)
  const fade3 = useLayerFade(progress, 0.63, 0.77)
  const fade4 = useLayerFade(progress, 0.84, 1.0)
  const fades = [fade0, fade1, fade2, fade3, fade4]

  const activeMotion: Partial<Record<WorkspaceSegment, MotionValue<number>>> = {}
  SCENES.forEach((scene, index) => {
    for (const segment of scene.highlights) activeMotion[segment] = fades[index].opacity
  })

  return (
    <section id="product" aria-labelledby="product-heading">
      <h2 id="product-heading" className="sr-only">
        {t('heading')}
      </h2>

      <div ref={trackRef} className="lp-track relative h-[320vh] lg:h-[520vh]">
        <div className="lp-stage sticky top-0 flex h-[100svh] items-center py-12">
          {/*
            Narracja bierze wysokosc tresci, ramka cala reszte wiersza.
            Sztywne `46vh` dawalo na wysokim oknie (np. 919x1700) ramke
            prawie kwadratowa, plywajaca posrodku czerni.
          */}
          <div className="mx-auto grid max-h-full w-full max-w-[1560px] gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,32%)_minmax(0,1fr)] lg:items-center lg:gap-8">
            <div className="lp-layers min-h-[112px] self-center">
              {SCENES.map((scene, index) => (
                <m.div
                  key={scene.index}
                  className="lp-layer"
                  style={{
                    opacity: fades[index].opacity,
                    y: fades[index].y,
                    visibility: fades[index].visibility,
                  }}
                >
                  <SceneCopy scene={scene} />
                </m.div>
              ))}
            </div>

            {/*
              Ramka trzyma PROPORCJE okna aplikacji, a nie ulamek viewportu:
              na telefonie pionowa (tam mock pokazuje uklad mobilny z dolnym
              paskiem), od `sm` pozioma jak prawdziwe okno. `max-h-full`
              pilnuje, zeby nigdy nie wyszla poza scene.
            */}
            <div className="aspect-[3/4] max-h-[74svh] min-h-[300px] w-full sm:aspect-[4/3] lg:max-h-[70svh]">
              <AppFrame
                activeMotion={activeMotion}
                label={t('frameLabel')}
                breadcrumb={
                  <span className="lp-layers">
                    {SCENES.map((scene, index) => (
                      <m.span
                        key={scene.index}
                        className="lp-layer flex items-center gap-1.5"
                        style={{
                          opacity: fades[index].opacity,
                          visibility: fades[index].visibility,
                        }}
                      >
                        <BreadcrumbLabel segment={scene.segment} />
                      </m.span>
                    ))}
                  </span>
                }
              >
                <div className="lp-layers h-full">
                  {SCENES.map((scene, index) => (
                    <m.div
                      key={scene.index}
                      className="lp-layer h-full min-h-0"
                      style={{
                        opacity: fades[index].opacity,
                        y: fades[index].y,
                        visibility: fades[index].visibility,
                      }}
                    >
                      {screenFor(index, month)}
                    </m.div>
                  ))}
                </div>
              </AppFrame>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── static ─────────────────────────────── */

function JourneyStatic({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.journey')

  return (
    <section id="product" aria-labelledby="product-heading" className="mx-auto max-w-[1560px] px-4 py-20 sm:px-6">
      <h2 id="product-heading" className="sr-only">
        {t('heading')}
      </h2>

      <div className="space-y-20">
        {SCENES.map((scene, index) => (
          <article key={scene.index} className="grid gap-6 lg:grid-cols-[minmax(0,30%)_minmax(0,1fr)] lg:gap-8">
            <div className="self-center">
              <SceneCopy scene={scene} />
            </div>
            <div className="h-[70vh] min-h-[420px]">
              <AppFrame active={scene.segment} label={t(`scenes.${scene.copyKey}.label`)}>
                {screenFor(index, month)}
              </AppFrame>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────────── shared ─────────────────────────────── */

function SceneCopy({ scene }: { scene: Scene }) {
  const t = useTranslations('marketing.journey.scenes')

  return (
    <>
      <span className="lp-mono lp-eyebrow">{scene.index}</span>
      <h3 className="lp-display lp-d3 mt-3">{t(`${scene.copyKey}.title`)}</h3>
      <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-[var(--lp-ink-2)] sm:text-base">
        {t(`${scene.copyKey}.body`)}
      </p>
    </>
  )
}

function BreadcrumbLabel({ segment }: { segment: WorkspaceSegment }) {
  const t = useTranslations('navigation')
  const section = MARKETING_SECTIONS.find((entry) => entry.segment === segment)!

  return (
    <>
      <span className="hidden text-zinc-400 sm:inline">{t(`groups.${section.group}`)}</span>
      <span className="hidden text-zinc-400 sm:inline">›</span>
      <span className="text-zinc-200">{t(`sections.${section.segment}`)}</span>
    </>
  )
}
