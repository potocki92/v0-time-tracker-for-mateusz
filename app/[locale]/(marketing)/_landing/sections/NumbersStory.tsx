'use client'

import { useRef } from 'react'
import { m } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import {
  DEMO_AUTOMATION_TARGET,
  DEMO_INVOICE,
  DEMO_MONTH,
  DEMO_WEEK,
  type DemoMonth,
} from '../demo/demo-data'
import { useDemoNames } from '../demo/useDemoNames'
import { useLayerFade, useTrackProgress } from '../motion/scene'

/**
 * „Od pracy do pieniedzy" — piec wartosci, jedna za druga, na pelnym ekranie.
 *
 * Zero kart, zero bento. Kazda liczba wynika z poprzedniej: dzien → tydzien →
 * miesiac → kwota → faktura. Wartosci ida z tego samego miesiaca, ktory liczy
 * automat, wiec sekwencja nie jest grafika — to arytmetyka produktu.
 *
 * Fallback `prefers-reduced-motion` robi CSS: sticky staje sie zwyklym
 * blokiem, a warstwy ustawiaja sie jedna pod druga.
 */
export function NumbersStory({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.flow')
  const fmt = useFormat()
  const names = useDemoNames()
  const trackRef = useRef<HTMLDivElement>(null)
  const progress = useTrackProgress(trackRef)

  const fade0 = useLayerFade(progress, 0.0, 0.15, 32)
  const fade1 = useLayerFade(progress, 0.22, 0.36, 32)
  const fade2 = useLayerFade(progress, 0.43, 0.57, 32)
  const fade3 = useLayerFade(progress, 0.64, 0.78, 32)
  const fade4 = useLayerFade(progress, 0.85, 1.0, 32)

  const steps = [
    {
      fade: fade0,
      value: fmt.hours(10),
      caption: t('today', { project: names.project(DEMO_AUTOMATION_TARGET.projectId) }),
      small: false,
    },
    {
      fade: fade1,
      value: fmt.hours(DEMO_WEEK.hours),
      caption: `${fmt.isoWeek(DEMO_WEEK.anchorDate)} · ${fmt.dateRange(DEMO_WEEK.from, DEMO_WEEK.to)}`,
      small: false,
    },
    {
      fade: fade2,
      value: fmt.hours(month.totalHours),
      caption: fmt.monthTitle(DEMO_MONTH.iso),
      small: false,
    },
    {
      fade: fade3,
      value: fmt.money(toMinor(month.earningsEur), 'EUR'),
      caption: t('toInvoice'),
      small: true,
    },
    { fade: fade4, value: DEMO_INVOICE.number, caption: t('invoiceReady'), small: true },
  ]

  return (
    <section id="flow" aria-labelledby="flow-heading">
      <h2 id="flow-heading" className="sr-only">
        {t('heading')}
      </h2>

      {/* `svh`, nie `vh`: na iOS `vh` ignoruje pasek Safari, wiec kazde jego
          chowanie zmienialoby postep sceny w srodku ruchu palca. */}
      <div ref={trackRef} className="lp-track relative h-[300svh] lg:h-[420svh]">
        <div className="lp-stage sticky top-0 flex h-[100svh] flex-col items-center justify-center px-5">
          <span className="lp-eyebrow mb-8">{t('eyebrow')}</span>

          <div className="lp-layers w-full text-center">
            {steps.map((step) => (
              <m.div
                key={step.caption}
                className="lp-layer"
                style={{
                  opacity: step.fade.opacity,
                  transform: step.fade.transform,
                  visibility: step.fade.visibility,
                }}
              >
                <p
                  className={`lp-colossal lp-mono tabular-nums ${step.small ? 'lp-colossal-sm' : ''}`}
                >
                  {step.value}
                </p>
                <p className="lp-eyebrow mt-6">{step.caption}</p>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
