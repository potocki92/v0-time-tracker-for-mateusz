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
import { storyWindows, useLayerFade, useTrackProgress } from '../motion/scene'
import { MOTION_SHIFT_LAYER } from '../motion/tokens'

/**
 * „Od pracy do pieniedzy" — piec wartosci, jedna za druga, na pelnym ekranie.
 *
 * Zero kart, zero bento. Kazda liczba wynika z poprzedniej: dzien → tydzien →
 * miesiac → kwota → faktura. Wartosci ida z tego samego miesiaca, ktory liczy
 * automat, wiec sekwencja nie jest grafika — to arytmetyka produktu.
 *
 * ── Rytm ──
 *
 * Kazda liczba ma swoj takt: WCHODZI, STOI, WYCHODZI, ustepuje nastepnej.
 * Okna nie sa dobierane recznie — liczy je `storyWindows`, ktore dzieli tor
 * przez liczbe krokow i zostawia miedzy nimi dokladnie tyle, ile trwa
 * wygaszenie poprzednika. Dopisanie szostej wartosci przestraja cala piatke i
 * nie wymaga ani jednej nowej liczby w tym pliku.
 *
 * Zadnego przenikania cyfr: dwie liczby po 50% to nie jest przejscie filmowe,
 * tylko nieczytelna kalka. Miedzy oknami jest wiec punkt, w ktorym nie ma
 * zadnej liczby, i tak ma byc — to oddech, ktory nadaje sekwencji takt.
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

  const windows = storyWindows(STEP_COUNT)

  // Piec jawnych wywolan zamiast petli: hooki musza byc bezwarunkowe.
  const fade0 = useLayerFade(progress, ...windows[0], MOTION_SHIFT_LAYER)
  const fade1 = useLayerFade(progress, ...windows[1], MOTION_SHIFT_LAYER)
  const fade2 = useLayerFade(progress, ...windows[2], MOTION_SHIFT_LAYER)
  const fade3 = useLayerFade(progress, ...windows[3], MOTION_SHIFT_LAYER)
  const fade4 = useLayerFade(progress, ...windows[4], MOTION_SHIFT_LAYER)

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

      <div ref={trackRef} className="lp-track lp-track-numbers relative">
        <div className="lp-stage sticky top-0 flex h-[100svh] flex-col items-center justify-center px-5">
          <span className="lp-eyebrow">{t('eyebrow')}</span>

          <div className="lp-layers mt-10 w-full text-center sm:mt-14">
            {steps.map((step, index) => (
              <m.div
                key={step.caption}
                className="lp-layer"
                style={{
                  opacity: step.fade.opacity,
                  transform: step.fade.transform,
                  visibility: step.fade.visibility,
                }}
              >
                {/*
                  Wskaznik postepu jedzie WEWNATRZ warstwy, wiec dziedziczy jej
                  jasnosc i nie kosztuje ani jednej dodatkowej wartosci
                  sterowanej scrollem. Ma byc ledwie widoczny — to licznik
                  sekwencji, nie element kompozycji.
                */}
                <p className="lp-mono lp-t11 tabular-nums text-[var(--lp-ink-3)]">
                  {String(index + 1).padStart(2, '0')} / {String(STEP_COUNT).padStart(2, '0')}
                </p>
                <p
                  className={`lp-colossal lp-mono mt-5 tabular-nums ${step.small ? 'lp-colossal-sm' : ''}`}
                >
                  {step.value}
                </p>
                <p className="lp-eyebrow mt-7">{step.caption}</p>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Piec krokow sekwencji: dzien → tydzien → miesiac → kwota → faktura. */
const STEP_COUNT = 5
