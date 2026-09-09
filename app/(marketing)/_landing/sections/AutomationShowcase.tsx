'use client'

import { useRef } from 'react'
import { m } from 'framer-motion'

import { formatHours } from '@/lib/format'

import {
  DEMO_AUTOMATION_TARGET,
  DEMO_MONTH,
  DEMO_PRESENCE,
  DEMO_WEEKDAY_KEYS,
  DEMO_WEEKDAY_SHORT,
  DEMO_WEEK_SCHEDULE,
  demoClient,
  type DemoMonth,
} from '../demo/demo-data'
import { useScrollMap, useTrackProgress } from '../motion/scene'
import { MonthGrid } from '../product/MonthGrid'

/**
 * Automatyczne zapisywanie pracy — najmocniejsza roznica produktu.
 *
 * Po lewej wejscie automatu: grafik tygodnia i os obecnosci (wyjazd → dom →
 * wyjazd). Po prawej wynik: miesiac wypelnia sie w kolejnosci dat, omijajac
 * niedziele i caly pobyt w domu.
 *
 * Wypelnienie NIE jest inscenizacja: dni policzyl `planDays` — ta sama czysta
 * funkcja, ktorej uzywa zadanie serwerowe automatu.
 */
export function AutomationShowcase({ month }: { month: DemoMonth }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const progress = useTrackProgress(trackRef)
  const client = demoClient(DEMO_AUTOMATION_TARGET.clientId)
  // Podsumowanie miesiaca wchodzi dopiero, gdy siatka jest juz wypelniona.
  const outcomeOpacity = useScrollMap(progress, [0.86, 0.95], [0, 1])

  const skipped = month.days.filter((day) => day.skipLabel !== null)
  const reasons = [...new Set(skipped.map((day) => day.skipLabel!))]

  return (
    <section id="automation" aria-labelledby="automation-heading">
      <div ref={trackRef} className="lp-track relative h-[260vh] lg:h-[340vh]">
        <div className="lp-stage sticky top-0 flex h-[100svh] items-center">
          <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
            <span className="lp-eyebrow">Automation</span>
            <h2 id="automation-heading" className="lp-display lp-d2 mt-3 max-w-[16ch]">
              Your calendar can fill itself.
            </h2>
            <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-[var(--lp-ink-2)] sm:text-base">
              Give TimeTracker your week and your trips. It writes the hours you actually worked —
              and leaves out the Sundays and the weeks you spent at home.
            </p>

            <div className="mt-5 grid gap-3 sm:mt-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-8">
              <div className="grid gap-3 sm:grid-cols-2 lg:block lg:space-y-4">
                <div className="lp-card p-4">
                  <p className="lp-eyebrow">Grafik tygodnia</p>
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
                            {DEMO_WEEKDAY_SHORT[index]}
                          </span>
                          <span className="hidden h-px flex-1 bg-white/10 lg:block" />
                          <span
                            className={`lp-mono tabular-nums ${
                              plan.enabled ? 'text-white' : 'text-[var(--lp-ink-3)]'
                            }`}
                          >
                            {plan.enabled ? formatHours(plan.hours) : 'wolne'}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="lp-card p-4">
                  <p className="lp-eyebrow">Obecność</p>
                  <ul className="mt-3 space-y-2">
                    {DEMO_PRESENCE.map((entry) => (
                      <li key={entry.range} className="flex items-center gap-2.5 text-xs">
                        <span
                          className={`h-6 w-1 rounded-full ${
                            entry.kind === 'trip' ? 'bg-[var(--lp-accent)]' : 'bg-white/15'
                          }`}
                        />
                        <span className="flex-1 text-[var(--lp-ink-2)]">{entry.label}</span>
                        <span className="lp-mono tabular-nums text-[var(--lp-ink-3)]">
                          {entry.range}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lp-card p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-white">{DEMO_MONTH.label}</p>
                  <m.p
                    className="lp-motion lp-mono text-sm tabular-nums text-[var(--lp-accent)]"
                    style={{ opacity: outcomeOpacity }}
                  >
                    {formatHours(month.totalHours)} · {month.workedDays} dni
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
                      {reason}
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
