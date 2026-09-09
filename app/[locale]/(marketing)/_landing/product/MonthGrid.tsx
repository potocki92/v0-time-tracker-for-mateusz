'use client'

import type { ReactNode } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import { useMotionProfile } from '../motion/profile'
import { useScrollTransform } from '../motion/scene'

import {
  DEMO_MONTH,
  DEMO_RATE_EUR,
  DEMO_WEEKDAY_DATES,
  type DemoDay,
} from '../demo/demo-data'

/**
 * Siatka miesiaca — replika `features/calendar/components/grid`.
 *
 * Zachowane sygnaly z aplikacji: tydzien od poniedzialku, weekend na
 * ciemniejszej powierzchni, lewa krawedz w kolorze statusu „Pracowalem",
 * godziny nad kwota, pasek koloru klienta na dole komorki, podswietlenie
 * dnia dzisiejszego.
 *
 * ── Trzy tryby wypelniania ──
 *
 * BEZ `progress` siatka jest gotowa i nie tworzy ani jednej wartosci
 * sterowanej scrollem. Tak uzywa jej ekran Kalendarza, ktory pokazuje miesiac
 * juz uzupelniony — wczesniej placil za to szescdziesiecioma `useTransform`
 * przypietymi do stalej jedynki.
 *
 * DESKTOP (`progress` + profil desktop) wypelnia miesiac DZIEN PO DNIU: kazda
 * komorka ma wlasne okno postepu i wlasna krzywa. Trzydziesci komorek to
 * szescdziesiat wartosci — na duzym ekranie ten detal widac i jest wart
 * swojej ceny.
 *
 * TELEFON (`progress` + profil mobile) wypelnia miesiac TYGODNIAMI. Piec
 * wierszy dzieli PIEC wartosci zamiast szescdziesieciu; komorki jednego
 * tygodnia pojawiaja sie razem. Na czterocalowej siatce i tak nie da sie
 * odczytac, ze dzien 12 wszedl kilkanascie milisekund przed dniem 13 —
 * zostaje ten sam komunikat („automat sam wypelnia kalendarz") za jedna
 * dwunasta pracy. Odpada tez `scale` komorki: sam `opacity` wystarcza, a
 * mniej animowanych wlasciwosci to mniej warstw kompozycji.
 */

interface MonthGridProps {
  days: readonly DemoDay[]
  /**
   * Postep sceny automatu. Pominiety — siatka jest od razu wypelniona i
   * calkowicie statyczna.
   */
  progress?: MotionValue<number>
  /** Zakres postepu, w ktorym wpisy pojawiaja sie po kolei. */
  fillRange?: [number, number]
  clientColor: string
  /** Dzien oznaczony jako „dzisiaj". */
  today?: number
  showAmounts?: boolean
  /** Rozciaga wiersze na cala wysokosc rodzica — jak siatka w aplikacji. */
  fill?: boolean
}

/** Dlugosc okna pojawiania sie pojedynczego wpisu, w ulamku toru sceny. */
const CELL_SPAN = 0.16

/** Komorka pusta na poczatku miesiaca (dopelnienie do poniedzialku). */
type Cell = DemoDay | null

/** Podzial miesiaca na wiersze siatki — dokladnie tak, jak leza na ekranie. */
function toWeeks(days: readonly DemoDay[], offset: number): Cell[][] {
  const cells: Cell[] = [...Array.from<Cell>({ length: offset }).fill(null), ...days]
  const weeks: Cell[][] = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }
  return weeks
}

/**
 * Okno postepu, w ktorym pojawia sie wpis o podanej kolejnosci (0 = pierwszy
 * zapisany dzien miesiaca, 1 = ostatni). Okna sasiednich dni zachodza na
 * siebie, wiec miesiac wypelnia sie plynnie, a nie skokami.
 */
function entryWindow(order: number, [lo, hi]: [number, number]): [number, number] {
  const start = lo + order * Math.max(0, hi - lo - CELL_SPAN)
  return [start, start + CELL_SPAN]
}

/**
 * Okno tygodnia to suma okien jego zapisanych dni. Tydzien bez ani jednego
 * wpisu (poczatek miesiaca, pobyt w domu) dostaje okno pierwszego wpisu — nie
 * ma tam czego pokazywac, a `useTransform` wymaga rosnacego zakresu.
 */
function weekWindow(
  week: Cell[],
  orderOf: (day: DemoDay) => number,
  fillRange: [number, number],
): [number, number] {
  const orders = week
    .filter((cell): cell is DemoDay => cell !== null && cell.hours !== null)
    .map(orderOf)

  if (orders.length === 0) return entryWindow(0, fillRange)

  const [start] = entryWindow(Math.min(...orders), fillRange)
  const [, end] = entryWindow(Math.max(...orders), fillRange)
  return [start, end]
}

export function MonthGrid({
  days,
  progress,
  fillRange = [0, 0],
  clientColor,
  today,
  showAmounts = true,
  fill = false,
}: MonthGridProps) {
  const fmt = useFormat()
  const profile = useMotionProfile()

  const weeks = toWeeks(days, DEMO_MONTH.firstWeekdayOffset)
  const filled = days.filter((day) => day.hours !== null)
  const orderOf = (day: DemoDay) => filled.indexOf(day) / Math.max(1, filled.length - 1)

  const byWeek = progress !== undefined && profile === 'mobile'

  const cellProps = (day: DemoDay) => ({
    day,
    clientColor,
    isToday: today === day.day,
    showAmount: showAmounts,
    fmt,
  })

  return (
    <div className={fill ? 'flex h-full flex-col' : undefined}>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DEMO_WEEKDAY_DATES.map((date) => (
          <span key={date} className="text-center lp-t8 uppercase tracking-wide text-zinc-400">
            {fmt.weekday(date, 'short')}
          </span>
        ))}
      </div>

      {/*
        Wiersze tygodni sa OSOBNYMI elementami takze wtedy, gdy nic nie
        animuja. Jeden uklad dla wszystkich trzech trybow znaczy, ze zmiana
        profilu ruchu po hydratacji nie rusza ani jednego piksela: geometria
        wierszy `grid-cols-7 gap-1` w gridzie o tym samym `gap` jest
        identyczna z geometria jednej wielkiej siatki.
      */}
      <div
        className={`grid gap-1 ${fill ? 'min-h-0 flex-1' : ''}`}
        style={fill ? { gridAutoRows: 'minmax(0, 1fr)' } : undefined}
      >
        {weeks.map((week, index) => {
          const cells = week.map((cell, position) =>
            cell === null ? (
              <span key={`pad-${position}`} aria-hidden />
            ) : progress === undefined || byWeek ? (
              <DayCell key={cell.day} {...cellProps(cell)} />
            ) : (
              <DayCellReveal
                key={cell.day}
                {...cellProps(cell)}
                progress={progress}
                window={entryWindow(orderOf(cell), fillRange)}
              />
            ),
          )

          return byWeek ? (
            <WeekReveal
              key={index}
              progress={progress}
              window={weekWindow(week, orderOf, fillRange)}
            >
              {cells}
            </WeekReveal>
          ) : (
            <div key={index} className="grid grid-cols-7 gap-1">
              {cells}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────── wiersz tygodnia ────────────────────────── */

/**
 * Jedna wartosc na caly tydzien. Wpisy w srodku sa zwyklymi elementami —
 * dziedzicza przezroczystosc po wierszu, wiec siedem komorek kosztuje tyle,
 * co jedna krzywa.
 */
function WeekReveal({
  progress,
  window,
  children,
}: {
  progress: MotionValue<number>
  window: [number, number]
  children: ReactNode
}) {
  const opacity = useTransform(progress, window, [0, 1])

  return (
    <m.div className="grid grid-cols-7 gap-1" style={{ opacity }}>
      {children}
    </m.div>
  )
}

/* ─────────────────────────────── komorka ────────────────────────────── */

interface CellProps {
  day: DemoDay
  clientColor: string
  isToday: boolean
  showAmount: boolean
  fmt: ReturnType<typeof useFormat>
}

function DayCell({ day, clientColor, isToday, showAmount, fmt }: CellProps) {
  const worked = day.hours !== null

  return (
    <CellShell day={day}>
      {worked && <span aria-hidden className="lp-day-fill" />}
      <DayNumber day={day.day} isToday={isToday} />
      {worked && (
        <span className="relative mt-auto block min-w-0">
          <Entry day={day} clientColor={clientColor} showAmount={showAmount} fmt={fmt} />
        </span>
      )}
    </CellShell>
  )
}

/** Wariant desktopowy: wpis ma wlasne okno postepu i wlasna krzywa. */
function DayCellReveal({
  day,
  clientColor,
  isToday,
  showAmount,
  fmt,
  progress,
  window,
}: CellProps & { progress: MotionValue<number>; window: [number, number] }) {
  const opacity = useTransform(progress, window, [0, 1])
  const transform = useScrollTransform(progress, window, ['scale(0.86)', 'scale(1)'])

  const worked = day.hours !== null

  return (
    <CellShell day={day}>
      {/* Skorka wpisu jest osobna warstwa sterowana tym samym postepem, co
          godziny — inaczej miesiac wygladalby na wypelniony, zanim automat
          cokolwiek dopisze. */}
      {worked && <m.span aria-hidden className="lp-day-fill" style={{ opacity }} />}
      <DayNumber day={day.day} isToday={isToday} />
      {worked && (
        <m.span className="relative mt-auto block min-w-0" style={{ opacity, transform }}>
          <Entry day={day} clientColor={clientColor} showAmount={showAmount} fmt={fmt} />
        </m.span>
      )}
    </CellShell>
  )
}

/**
 * Szkielet komorki jest ZAWSZE widoczny — obramowanie, tlo i numer dnia stoja
 * na miejscu od pierwszej klatki. Pojawia sie wylacznie wpis, bo to on jest
 * dzielem automatu.
 */
function CellShell({ day, children }: { day: DemoDay; children: ReactNode }) {
  const worked = day.hours !== null
  const weekend = day.weekday >= 5

  return (
    <div
      className={[
        'lp-day',
        weekend && !worked ? 'lp-day-weekend' : '',
        day.inTrip ? 'lp-day-trip' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

function DayNumber({ day, isToday }: { day: number; isToday: boolean }) {
  return (
    <span
      className={
        isToday
          ? 'relative flex size-3.5 items-center justify-center rounded-full bg-[var(--lp-accent)] lp-t8 font-semibold text-black'
          : 'relative lp-t8 font-semibold leading-none text-zinc-400'
      }
    >
      {day}
    </span>
  )
}

function Entry({ day, clientColor, showAmount, fmt }: Omit<CellProps, 'isToday'>) {
  return (
    <>
      <span className="block truncate lp-t9 font-bold leading-tight text-white">
        {fmt.hours(day.hours)}
      </span>
      {showAmount && (
        <span className="hidden truncate lp-t8 leading-tight text-zinc-400 sm:block">
          {fmt.money(toMinor((day.hours ?? 0) * DEMO_RATE_EUR), 'EUR')}
        </span>
      )}
      <span
        aria-hidden
        className="absolute inset-x-[-4px] bottom-[-4px] h-[2px] opacity-80"
        style={{ background: clientColor }}
      />
    </>
  )
}
