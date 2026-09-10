'use client'

import type { ReactNode } from 'react'
import { m, type MotionValue } from 'framer-motion'
import { CalendarDays } from 'lucide-react'

import { useFormat } from '@/lib/format/client'

import {
  DEMO_MONTH,
  DEMO_WEEKDAY_DATES,
  type DemoDay,
  type DemoMonth,
} from '../../../demo/demo-data'
import {
  capabilityStep,
  capabilityWindow,
  useCapabilityStepMotion,
  type ProgressWindow,
} from '../../../motion/capability'
import { CapabilityCard, type CapabilityCardProps } from '../CapabilityCard'

/**
 * Karta 02 — kalendarz. Miesiac zapala sie WIERSZAMI, nie dniami.
 *
 * ── Dlaczego tygodniami ──
 *
 * Osobny `useTransform` na kazdy dzien to 35 wartosci sterowanych scrollem w
 * jednej ozdobnej kafelce; `MonthGrid` placi te cene na desktopie tylko
 * dlatego, ze tam siatka jest bohaterem sceny i zajmuje pol ekranu. Tutaj
 * kafelka ma ~120 px wysokosci — roznicy miedzy dniem 12 a 13 nie da sie
 * zobaczyc, a rachunek za nia jest ten sam. Piec wierszy niesie dokladnie
 * ten sam komunikat („miesiac wypelnia sie stopniowo") za jedna siodma
 * pracy. To jest ta sama decyzja, ktora `MonthGrid` podejmuje na telefonie,
 * i ten sam powod.
 *
 * Intensywnosc dnia idzie z PRAWDZIWEGO miesiaca policzonego przez automat,
 * a nie z tablicy dobranej pod grafike — landing nie pokazuje liczb, ktorych
 * nie da sie wyprowadzic.
 */
export function CalendarCard({
  progress,
  profile,
  enter,
  reveal,
  month,
}: CapabilityCardProps & { month: DemoMonth }) {
  const window = capabilityWindow('calendar', profile)
  const weeks = toWeeks(month.days)

  return (
    <CapabilityCard
      cardKey="calendar"
      enter={enter}
      icon={<CalendarDays size={14} />}
      className="lg:col-span-5"
    >
      {/* Ograniczenie szerokosci dziala tylko na desktopie: na telefonie
          karta i tak jest wezsza, wiec komorki maja tam proporcje kwadratu. */}
      <div className="max-w-[380px]">
        <WeekdayHeader />
        {reveal ? (
          <HeatRevealed progress={progress} window={window} weeks={weeks} />
        ) : (
          <div className="mt-1 space-y-1">
            {weeks.map((week, index) => (
              <WeekRow key={index} week={week} />
            ))}
          </div>
        )}
      </div>
    </CapabilityCard>
  )
}

/* ──────────────────────────── model kafelki ─────────────────────────── */

/** Pusta komorka dopelniajaca poczatek miesiaca do poniedzialku. */
type HeatCell = DemoDay | null

/** Ile wierszy ma kafelka. Stala, bo tyle jest wywolan hooka nizej. */
const HEAT_WEEKS = 5

/**
 * Dokladnie piec wierszy po siedem komorek — takze wtedy, gdy miesiac nie
 * wypelnia calej siatki. Liczba wierszy jest tu STALA, bo od niej zalezy
 * liczba wywolan hooka; wyliczanie jej z dlugosci miesiaca zamienialoby
 * dane w liczbe hookow, czego React nie wybacza.
 */
function toWeeks(days: readonly DemoDay[]): HeatCell[][] {
  const cells: HeatCell[] = [
    ...Array.from<HeatCell>({ length: DEMO_MONTH.firstWeekdayOffset }).fill(null),
    ...days,
  ]
  return Array.from({ length: HEAT_WEEKS }, (_, row) => {
    const week = cells.slice(row * 7, row * 7 + 7)
    return [...week, ...Array.from<HeatCell>({ length: 7 - week.length }).fill(null)]
  })
}

/**
 * Trzy poziomy, nie cztery: miesiac demonstracyjny zna dokladnie dwie
 * dlugosci dnia (8 h w sobote, 10 h w tygodniu) plus dni bez wpisu. Piaty
 * odcien nie mialby czego opisywac.
 */
function heatLevel(cell: HeatCell): 0 | 1 | 2 {
  if (cell === null || cell.hours === null) return 0
  return cell.hours >= 10 ? 2 : 1
}

/* ─────────────────────────────── warstwy ────────────────────────────── */

function WeekdayHeader() {
  const fmt = useFormat()

  return (
    <div aria-hidden className="grid grid-cols-7 gap-1">
      {DEMO_WEEKDAY_DATES.map((date) => (
        <span key={date} className="text-center lp-t8 uppercase tracking-wide text-zinc-500">
          {fmt.weekday(date, 'short')}
        </span>
      ))}
    </div>
  )
}

/**
 * Siatka jest DEKORACJA: to samo mowi zdanie nad nia, a 35 pustych komorek w
 * drzewie dostepnosci nie niesie zadnej informacji.
 */
function WeekRow({ week }: { week: HeatCell[] }) {
  return (
    <div aria-hidden className="grid grid-cols-7 gap-1">
      {week.map((cell, index) => (
        <span key={index} className="lp-heat" data-level={heatLevel(cell)} />
      ))}
    </div>
  )
}

function RevealedRow({
  progress,
  window,
  children,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
  children: ReactNode
}) {
  const step = useCapabilityStepMotion(progress, window, 6)

  return (
    <m.div className="lp-motion" style={{ opacity: step.opacity, transform: step.transform }}>
      {children}
    </m.div>
  )
}

/**
 * Piec jawnych wywolan zamiast petli — hooki musza byc bezwarunkowe, a
 * wierszy siatki miesiaca jest zawsze piec (30 dni + dopelnienie do
 * poniedzialku nigdy nie przekracza 35 komorek).
 */
function HeatRevealed({
  progress,
  window,
  weeks,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
  weeks: HeatCell[][]
}) {
  const week0 = capabilityStep(window, 0, HEAT_WEEKS)
  const week1 = capabilityStep(window, 1, HEAT_WEEKS)
  const week2 = capabilityStep(window, 2, HEAT_WEEKS)
  const week3 = capabilityStep(window, 3, HEAT_WEEKS)
  const week4 = capabilityStep(window, 4, HEAT_WEEKS)

  return (
    <div className="mt-1 space-y-1">
      <RevealedRow progress={progress} window={week0}>
        <WeekRow week={weeks[0]} />
      </RevealedRow>
      <RevealedRow progress={progress} window={week1}>
        <WeekRow week={weeks[1]} />
      </RevealedRow>
      <RevealedRow progress={progress} window={week2}>
        <WeekRow week={weeks[2]} />
      </RevealedRow>
      <RevealedRow progress={progress} window={week3}>
        <WeekRow week={weeks[3]} />
      </RevealedRow>
      <RevealedRow progress={progress} window={week4}>
        <WeekRow week={weeks[4]} />
      </RevealedRow>
    </div>
  )
}
