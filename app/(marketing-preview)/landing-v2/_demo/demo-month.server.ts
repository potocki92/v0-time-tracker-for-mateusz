import 'server-only'

import {
  SKIP_REASON_LABELS,
  planDays,
  type DayDecision,
  type WeekSchedule,
} from '@/features/work-automation/domain'

import {
  DEMO_AUTOMATION_START,
  DEMO_MONTH,
  DEMO_RATE_EUR,
  DEMO_TRIPS,
  DEMO_WEEK_SCHEDULE,
  type DemoDay,
  type DemoMonth,
} from './demo-data'

/**
 * Miesiac demonstracyjny liczony PRAWDZIWYM automatem aplikacji.
 *
 * `planDays` to ta sama czysta funkcja, ktorej uzywa zadanie serwerowe i
 * podglad w ustawieniach — marketingowy kalendarz nie moze wiec pokazac dnia,
 * ktorego automat by nie zapisal. To jedyny sposob, zeby sekcja „kalendarz
 * wypelnia sie sam" nie rozjechala sie z produktem po pierwszej zmianie regul.
 *
 * Server-only celowo: barrel `@/features/work-automation/domain` ciagnie zod,
 * ktory nie ma czego szukac w bundlu strony marketingowej. Wynik jedzie do
 * komponentow klienckich jako zwykle propsy.
 */

const iso = (day: number) =>
  `${DEMO_MONTH.year}-${String(DEMO_MONTH.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const inAnyTrip = (date: string) =>
  DEMO_TRIPS.some((trip) => trip.startDate <= date && date <= trip.endDate)

export function buildDemoMonth(): DemoMonth {
  const decisions: DayDecision[] = planDays({
    config: {
      startDate: DEMO_AUTOMATION_START,
      weekSchedule: DEMO_WEEK_SCHEDULE as WeekSchedule,
    },
    trips: DEMO_TRIPS,
    resumptions: [],
    entriesByDate: new Map(),
    fromDate: iso(1),
    days: DEMO_MONTH.days,
  })

  const days = decisions.map((decision, index): DemoDay => ({
    day: index + 1,
    weekday: (DEMO_MONTH.firstWeekdayOffset + index) % 7,
    hours: decision.action === 'create' ? decision.hours : null,
    skipLabel: decision.action === 'skip' ? SKIP_REASON_LABELS[decision.reason] : null,
    inTrip: inAnyTrip(decision.date),
  }))

  const totalHours = days.reduce((sum, day) => sum + (day.hours ?? 0), 0)

  return {
    days,
    totalHours,
    earningsEur: totalHours * DEMO_RATE_EUR,
    workedDays: days.filter((day) => day.hours !== null).length,
  }
}
