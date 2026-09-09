'use client'

import { useRef, type ReactNode } from 'react'
import { m, useReducedMotion, type MotionValue } from 'framer-motion'

import { WORKSPACE_GROUP_LABELS, WORKSPACE_SECTIONS, type WorkspaceSegment } from '@/lib/workspace/sections'

import type { DemoMonth } from '../_demo/demo-data'
import { useLayerFade, useTrackProgress } from '../_motion/scene'
import { AppFrame } from '../_product/AppFrame'
import { CalendarScreen } from '../_product/screens/CalendarScreen'
import { DashboardScreen } from '../_product/screens/DashboardScreen'
import { InvoiceScreen } from '../_product/screens/InvoiceScreen'
import { ProjectsScreen } from '../_product/screens/ProjectsScreen'
import { ReportsScreen } from '../_product/screens/ReportsScreen'

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
  /** Sekcje podswietlone w sidebarze — scena „Projekty" swieci dwie. */
  highlights: readonly WorkspaceSegment[]
  title: string
  body: string
  label: string
}

const SCENES: readonly Scene[] = [
  {
    index: '01',
    segment: 'dashboard',
    highlights: ['dashboard'],
    title: 'Know where your time went.',
    body: 'Hours this week against your target, what they are worth, which projects are moving and which invoices are still open.',
    label: 'Pulpit: godziny tygodnia, zarobki, wykres, projekty i faktury',
  },
  {
    index: '02',
    segment: 'calendar',
    highlights: ['calendar'],
    title: 'Your work, day by day.',
    body: 'One entry per day — hours, client, rate, status. Worked, day off, vacation and sick leave all live on the same grid.',
    label: 'Kalendarz: siatka wrzesnia 2026 z godzinami i kwotami',
  },
  {
    index: '03',
    segment: 'projects',
    highlights: ['projects', 'clients'],
    title: 'Every hour knows who it belongs to.',
    body: 'The client carries the rate, the project carries the budget. Change a rate and the old one stays on the hours it was earned on.',
    label: 'Projekty i klienci: budzety, godziny i stawki',
  },
  {
    index: '04',
    segment: 'invoices',
    highlights: ['invoices'],
    title: 'Turn work into an invoice.',
    body: 'Pick a period and the timesheet becomes line items — quantity, rate, VAT, numbering, PDF.',
    label: 'Faktura FV 09/2026 zbudowana z godzin miesiaca',
  },
  {
    index: '05',
    segment: 'reports',
    highlights: ['reports'],
    title: 'See what the month was worth.',
    body: 'Hours per project, per client, per month — with CSV and PDF export when the accountant asks.',
    label: 'Raporty: wykres godzin i podzial na projekty',
  },
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
        Scroll through the product
      </h2>

      <div ref={trackRef} className="lv2-track relative h-[320vh] lg:h-[520vh]">
        <div className="lv2-stage sticky top-0 flex h-[100svh] items-center">
          <div className="mx-auto grid w-full max-w-[1560px] gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,30%)_minmax(0,1fr)] lg:gap-8">
            <div className="lv2-layers min-h-[112px] self-center">
              {SCENES.map((scene, index) => (
                <m.div
                  key={scene.index}
                  className="lv2-layer"
                  style={{ opacity: fades[index].opacity, y: fades[index].y }}
                >
                  <SceneCopy scene={scene} />
                </m.div>
              ))}
            </div>

            <div className="h-[46vh] min-h-[300px] lg:h-[74vh]">
              <AppFrame
                activeMotion={activeMotion}
                label="Interfejs TimeTrackera: pulpit, kalendarz, projekty, faktura i raporty"
                breadcrumb={
                  <span className="lv2-layers">
                    {SCENES.map((scene, index) => (
                      <m.span
                        key={scene.index}
                        className="lv2-layer flex items-center gap-1.5"
                        style={{ opacity: fades[index].opacity }}
                      >
                        <BreadcrumbLabel segment={scene.segment} />
                      </m.span>
                    ))}
                  </span>
                }
              >
                <div className="lv2-layers h-full">
                  {SCENES.map((scene, index) => (
                    <m.div
                      key={scene.index}
                      className="lv2-layer h-full min-h-0"
                      style={{ opacity: fades[index].opacity, y: fades[index].y }}
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
  return (
    <section id="product" aria-labelledby="product-heading" className="mx-auto max-w-[1560px] px-4 py-20 sm:px-6">
      <h2 id="product-heading" className="sr-only">
        Scroll through the product
      </h2>

      <div className="space-y-20">
        {SCENES.map((scene, index) => (
          <article key={scene.index} className="grid gap-6 lg:grid-cols-[minmax(0,30%)_minmax(0,1fr)] lg:gap-8">
            <div className="self-center">
              <SceneCopy scene={scene} />
            </div>
            <div className="h-[70vh] min-h-[420px]">
              <AppFrame active={scene.segment} label={scene.label}>
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
  return (
    <>
      <span className="lv2-mono lv2-eyebrow">{scene.index}</span>
      <h3 className="lv2-display lv2-d3 mt-3">{scene.title}</h3>
      <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-[var(--lv2-ink-2)] sm:text-base">
        {scene.body}
      </p>
    </>
  )
}

function BreadcrumbLabel({ segment }: { segment: WorkspaceSegment }) {
  const section = WORKSPACE_SECTIONS.find((entry) => entry.segment === segment)!
  return (
    <>
      <span className="hidden text-zinc-400 sm:inline">{WORKSPACE_GROUP_LABELS[section.group]}</span>
      <span className="hidden text-zinc-400 sm:inline">›</span>
      <span className="text-zinc-200">{section.label}</span>
    </>
  )
}
