'use client'

import { useRef } from 'react'
import { m } from 'framer-motion'

import { formatHours, formatMoney, toMinor } from '@/lib/format'

import { DEMO_INVOICE, DEMO_MONTH, DEMO_WEEK, type DemoMonth } from '../_demo/demo-data'
import { useLayerFade, useTrackProgress } from '../_motion/scene'

/**
 * „From work to money" — pieć wartosci, jedna za druga, na pelnym ekranie.
 *
 * Zero kart, zero bento. Kazda liczba wynika z poprzedniej: dzien → tydzien →
 * miesiac → kwota → faktura. Wartosci ida z tego samego miesiaca, ktory liczy
 * automat, wiec sekwencja nie jest grafika — to arytmetyka produktu.
 *
 * Fallback `prefers-reduced-motion` robi CSS: sticky staje sie zwyklym
 * blokiem, a warstwy ustawiaja sie jedna pod druga.
 */
export function NumbersStory({ month }: { month: DemoMonth }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const progress = useTrackProgress(trackRef)

  const fade0 = useLayerFade(progress, 0.0, 0.15, 32)
  const fade1 = useLayerFade(progress, 0.22, 0.36, 32)
  const fade2 = useLayerFade(progress, 0.43, 0.57, 32)
  const fade3 = useLayerFade(progress, 0.64, 0.78, 32)
  const fade4 = useLayerFade(progress, 0.85, 1.0, 32)

  const steps = [
    { fade: fade0, value: formatHours(10), caption: 'Dzisiaj · Im Winkel 51', small: false },
    { fade: fade1, value: formatHours(DEMO_WEEK.hours), caption: DEMO_WEEK.label, small: false },
    { fade: fade2, value: formatHours(month.totalHours), caption: DEMO_MONTH.label, small: false },
    {
      fade: fade3,
      value: formatMoney(toMinor(month.earningsEur), 'EUR'),
      caption: 'Do wystawienia',
      small: true,
    },
    { fade: fade4, value: DEMO_INVOICE.number, caption: 'Faktura gotowa', small: true },
  ]

  return (
    <section id="flow" aria-labelledby="flow-heading">
      <h2 id="flow-heading" className="sr-only">
        From work to money
      </h2>

      <div ref={trackRef} className="lv2-track relative h-[300vh] lg:h-[420vh]">
        <div className="lv2-stage sticky top-0 flex h-[100svh] flex-col items-center justify-center px-5">
          <span className="lv2-eyebrow mb-8">From work to money</span>

          <div className="lv2-layers w-full text-center">
            {steps.map((step) => (
              <m.div
                key={step.caption}
                className="lv2-layer"
                style={{ opacity: step.fade.opacity, y: step.fade.y }}
              >
                <p
                  className={`lv2-colossal lv2-mono tabular-nums ${step.small ? 'lv2-colossal-sm' : ''}`}
                >
                  {step.value}
                </p>
                <p className="lv2-eyebrow mt-6">{step.caption}</p>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
