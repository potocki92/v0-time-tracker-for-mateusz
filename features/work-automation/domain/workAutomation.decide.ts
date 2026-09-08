import { parseClockMinutes, zonedInstant, zonedParts } from '@/lib/date/timezone'
import { addDaysIso } from '@/features/trips/domain'
import { WEEKDAY_KEYS } from './workAutomation.constants'
import { resolvePresence } from './workAutomation.presence'
import type {
  DayDecision,
  DayDecisionInput,
  ExistingEntry,
  WeekdayKey,
  WorkAutomationConfig,
} from './workAutomation.types'

/** Indeks `Date#getUTCDay()` (0 = niedziela) na klucz grafiku. */
const WEEKDAY_BY_UTC_DAY: readonly WeekdayKey[] = [
  'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat',
]

export function weekdayKeyOf(isoDate: string): WeekdayKey {
  const [year, month, day] = isoDate.split('-').map(Number)
  return WEEKDAY_BY_UTC_DAY[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

/**
 * Jedyna funkcja decyzyjna automatu — uzywa jej i zadanie serwerowe, i podglad
 * w ustawieniach. Czysta: zadnego czytania bazy ani zegara w srodku.
 *
 * Kolejnosc regul jest czescia kontraktu:
 *  1. data sprzed uruchomienia automatu,
 *  2. pobyt w domu,
 *  3. dzien tygodnia wylaczony w grafiku,
 *  4. istniejacy wpis rzeczywisty — niezaleznie od statusu i od tego, kto go
 *     utworzyl. Obejmuje to zarowno reczna prace, jak i urlop, chorobe czy
 *     dzien wolny: automat nie nadpisuje decyzji uzytkownika. Sam plan
 *     (`predicted`) nie jest dowodem wykonania pracy i nie blokuje zapisu.
 */
export function decideDay(input: DayDecisionInput): DayDecision {
  const { date } = input

  if (date < input.activationDate) return { action: 'skip', date, reason: 'before_start' }

  const presence = resolvePresence({
    date,
    trips: input.trips,
    resumptions: input.resumptions,
    activationDate: input.activationDate,
  })
  if (presence.at === 'home') return { action: 'skip', date, reason: 'home_stay' }

  const plan = input.weekSchedule[weekdayKeyOf(date)]
  if (!plan?.enabled || plan.hours <= 0) return { action: 'skip', date, reason: 'weekday_off' }

  if (input.existingEntries.some((entry) => entry.entryKind === 'real')) {
    return { action: 'skip', date, reason: 'entry_exists' }
  }

  return { action: 'create', date, hours: plan.hours }
}

export interface PlanInput {
  config: Pick<WorkAutomationConfig, 'startDate' | 'weekSchedule'>
  trips: readonly { startDate: string; endDate: string }[]
  resumptions: readonly string[]
  /** Wpisy istniejace dla kazdej daty z zakresu podgladu. */
  entriesByDate: ReadonlyMap<string, readonly ExistingEntry[]>
  fromDate: string
  days: number
}

/** Podglad kolejnych dni — ta sama logika, zero zapisow. */
export function planDays({
  config,
  trips,
  resumptions,
  entriesByDate,
  fromDate,
  days,
}: PlanInput): DayDecision[] {
  const decisions: DayDecision[] = []

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDaysIso(fromDate, offset)
    decisions.push(
      decideDay({
        date,
        weekSchedule: config.weekSchedule,
        activationDate: config.startDate,
        trips,
        resumptions,
        existingEntries: entriesByDate.get(date) ?? [],
      }),
    )
  }

  return decisions
}

/**
 * Czy dla lokalnej daty `date` minela juz godzina zapisu.
 *
 * Dni wczesniejsze niz dzisiejszy sa z definicji wymagalne (zaleglosc),
 * dzisiejszy dopiero po osiagnieciu godziny. Dni przyszlych nie zapisujemy.
 */
export function isDue(
  date: string,
  localToday: string,
  localMinutes: number,
  runMinutes: number,
): boolean {
  if (date > localToday) return false
  if (date < localToday) return true
  return localMinutes >= runMinutes
}

/**
 * Najblizszy planowany zapis jako chwila UTC.
 *
 * Godzina, ktora wiosna nie istnieje, wypada po przeskoku czasu — zgodnie
 * z regula „wykonaj przy pierwszej dostepnej chwili po niej".
 */
export function nextRunInstant(
  config: Pick<WorkAutomationConfig, 'runTime' | 'timeZone'>,
  now: Date,
): Date | null {
  const runMinutes = parseClockMinutes(config.runTime)
  if (runMinutes === null) return null

  const local = zonedParts(now, config.timeZone)
  const date = local.minutes < runMinutes ? local.date : addDaysIso(local.date, 1)

  return zonedInstant(date, runMinutes, config.timeZone)
}

/** Grafik ma sens tylko wtedy, gdy przynajmniej jeden dzien jest wlaczony. */
export function hasWorkingDay(weekSchedule: WorkAutomationConfig['weekSchedule']): boolean {
  return WEEKDAY_KEYS.some((key) => weekSchedule[key]?.enabled && weekSchedule[key].hours > 0)
}
