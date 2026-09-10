'use client'

import { useRef } from 'react'
import { m, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { useFormat } from '@/lib/format/client'

import {
  DEMO_AUTOMATION_TARGET,
  DEMO_MONTH,
  DEMO_PRESENCE,
  DEMO_WEEKDAY_DATES,
  DEMO_WEEKDAY_KEYS,
  DEMO_WEEK_SCHEDULE,
  demoClient,
  type DemoMonth,
} from '../demo/demo-data'
import { useTrackProgress } from '../motion/scene'
import { MonthGrid } from '../product/MonthGrid'

/**
 * Automatyczne zapisywanie pracy — najmocniejsza roznica produktu.
 *
 * Po lewej wejscie automatu: grafik tygodnia i os obecnosci (wyjazd → dom →
 * wyjazd). Po prawej wynik: miesiac wypelnia sie w kolejnosci dat, omijajac
 * niedziele i caly pobyt w domu.
 *
 * Wypelnienie NIE jest inscenizacja: dni policzyl `planDays` — ta sama czysta
 * funkcja, ktorej uzywa zadanie serwerowe automatu. Powody pominiecia
 * przychodza jako klucze domeny i tlumacza sie tutaj.
 */
export function AutomationShowcase({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.automation')
  const fmt = useFormat()
  const trackRef = useRef<HTMLDivElement>(null)
  const progress = useTrackProgress(trackRef)
  const client = demoClient(DEMO_AUTOMATION_TARGET.clientId)
  // Podsumowanie miesiaca wchodzi dopiero, gdy siatka jest juz wypelniona.
  const outcomeOpacity = useTransform(progress, [0.86, 0.95], [0, 1])

  const reasons = [
    ...new Set(
      month.days
        .map((day) => day.skipReason)
        .filter((reason): reason is string => reason !== null),
    ),
  ]

  return (
    <section id="automation" aria-labelledby="automation-heading">
      {/* `svh`, nie `vh`: na iOS `vh` ignoruje pasek Safari, wiec kazde jego
          chowanie zmienialoby postep sceny w srodku ruchu palca. */}
      <div ref={trackRef} className="lp-track relative h-[260svh] lg:h-[340svh]">
        <div className="lp-stage sticky top-0 flex h-[100svh] items-center">
          <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
            <span className="lp-eyebrow">{t('eyebrow')}</span>
            <h2 id="automation-heading" className="lp-display lp-d2 mt-3 max-w-[16ch]">
              {t('heading')}
            </h2>
            <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-[var(--lp-ink-2)] sm:text-base">
              {t('lead')}
            </p>

            <div className="mt-5 grid gap-3 sm:mt-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-8">
              <div className="grid gap-3 sm:grid-cols-2 lg:block lg:space-y-4">
                <div className="lp-card p-4">
                  <p className="lp-eyebrow">{t('scheduleTitle')}</p>
                  {/* Na telefonie grafik lezy w siedmiu kolumnach, na desktopie
                      w siedmiu wierszach — kolumna scenografii ma tam miejsce,
                      a jeden ekran telefonu musi pomiescic jeszcze kalendarz. */}
                  <ul className="mt-3 grid grid-cols-7 gap-1 lg:block lg:space-y-1.5">
                    {DEMO_WEEKDAY_KEYS.map((key, index) => {
                      const plan = DEMO_WEEK_SCHEDULE[key]
                      return (
                        <li
                          key={key}
                          className="flex flex-col items-center gap-0.5 text-xs lg:flex-row lg:gap-3"
                        >
                          <span className="text-[var(--lp-ink-3)] lg:w-8">
                            {fmt.weekday(DEMO_WEEKDAY_DATES[index], 'short')}
                          </span>
                          <span className="hidden h-px flex-1 bg-white/10 lg:block" />
                          <span
                            className={`lp-mono tabular-nums ${
                              plan.enabled ? 'text-white' : 'text-[var(--lp-ink-3)]'
                            }`}
                          >
                            {plan.enabled ? fmt.hours(plan.hours) : t('dayOff')}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="lp-card p-4">
                  <p className="lp-eyebrow">{t('presenceTitle')}</p>
                  <ul className="mt-3 space-y-2">
                    {DEMO_PRESENCE.map((entry) => (
                      <li key={entry.from} className="flex items-center gap-2.5 text-xs">
                        <span
                          className={`h-6 w-1 rounded-full ${
                            entry.kind === 'trip' ? 'bg-[var(--lp-accent)]' : 'bg-white/15'
                          }`}
                        />
                        <span className="flex-1 text-[var(--lp-ink-2)]">
                          {t(`presence.${entry.kind}`)}
                        </span>
                        <span className="lp-mono tabular-nums text-[var(--lp-ink-3)]">
                          {fmt.dateRange(entry.from, entry.to)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lp-card p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-white">{fmt.monthTitle(DEMO_MONTH.iso)}</p>
                  <m.p
                    className="lp-motion lp-mono text-sm tabular-nums text-[var(--lp-accent)]"
                    style={{ opacity: outcomeOpacity }}
                  >
                    {t('outcome', { hours: fmt.hours(month.totalHours), days: month.workedDays })}
                  </m.p>
                </div>

                <div className="mt-3">
                  <MonthGrid
                    days={month.days}
                    progress={progress}
                    fillRange={[0.16, 0.9]}
                    clientColor={client.color}
                    showAmounts={false}
                  />
                </div>

                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--lp-hair)] pt-3">
                  {reasons.map((reason) => (
                    <li key={reason} className="lp-t11 text-[var(--lp-ink-3)]">
                      <span aria-hidden className="mr-1.5 inline-block size-1.5 rounded-full bg-white/20 align-middle" />
                      {t(`skipReasons.${reason}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
