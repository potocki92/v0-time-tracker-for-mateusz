import {
  calculateEntryMoney,
  fallbackFromClient,
  resolveAppliedCurrency,
  resolveAppliedRate,
  resolveAppliedWorkType,
} from '@/lib/finance/entry-calculations'
import type { Client, WorkEntry } from '@/lib/types'
import type {
  AbsenceInput,
  IsoDate,
  MetricsPeriod,
  MetricsSettings,
  MonthMetricsInput,
  WorkEntryInput,
} from './types'

/**
 * Tłumaczenie modelu bazy na kontrakt metryk.
 *
 * Cała wiedza o `status`, `entry_kind`, snapshotach stawek i akordzie kończy
 * się tutaj — `computeMonthMetrics` widzi już tylko czyste wejście.
 */

/** Norma dobowa w godzinach — 1/5 etatu 40 h. Podstawa celu, planu i prognozy. */
const DAILY_NORM_HOURS = 8

const ABSENCE_KIND: Record<string, AbsenceInput['kind']> = {
  vacation: 'vacation',
  sick_leave: 'sick',
  day_off: 'dayOff',
  // "nie pracowałem" to z punktu widzenia metryk taki sam dzień wolny.
  not_worked: 'dayOff',
}

export function defaultMetricsSettings(
  eurRate: number,
  over: Partial<MetricsSettings> = {},
): MetricsSettings {
  return {
    dailyNormHours: DAILY_NORM_HOURS,
    hoursGoalMode: 'businessDays',
    manualHoursGoal: null,
    earningsGoalMinor: null,
    displayCurrency: 'PLN',
    absenceBreaksStreak: false,
    eurRateBps: Math.round(eurRate * 10_000),
    ...over,
  }
}

export function toMetricsInput(args: {
  period: MetricsPeriod
  today: IsoDate
  workEntries: WorkEntry[]
  clients: Client[]
  settings: MetricsSettings
}): MonthMetricsInput {
  const clientMap = new Map(args.clients.map((c) => [c.id, c]))

  const entries: WorkEntryInput[] = []
  const absences: AbsenceInput[] = []

  for (const entry of args.workEntries) {
    if (entry.status !== 'worked') {
      const kind = ABSENCE_KIND[entry.status]
      if (kind) absences.push({ date: entry.date, kind })
      continue
    }
    entries.push(toWorkEntryInput(entry, clientMap))
  }

  return {
    period: args.period,
    today: args.today,
    entries,
    absences,
    settings: args.settings,
  }
}

function toWorkEntryInput(
  entry: WorkEntry,
  clients: Map<string, Client>,
): WorkEntryInput {
  const client = entry.client_id ? clients.get(entry.client_id) : undefined
  const fallback = client
    ? fallbackFromClient(client)
    : { rate: 0, currency: 'PLN' as const, workType: 'hourly' as const }

  const currency = resolveAppliedCurrency(entry, fallback)
  const isPiecework = resolveAppliedWorkType(entry, fallback) === 'piecework'

  return {
    date: entry.date,
    hours: entry.hours ?? 0,
    // Wpisy bez projektu trafiają do jednego kubełka zamiast znikać z podziału.
    projectId: entry.project_id ?? UNASSIGNED_PROJECT_ID,
    clientId: entry.client_id,
    // Akord nie ma stawki godzinowej — kwotę liczy `calculateEntryMoney`,
    // żeby ilości i zaokrąglenia zostały tam, gdzie były dotąd.
    rateMinor: isPiecework ? null : Math.round(resolveAppliedRate(entry, fallback) * 100),
    amountMinor: isPiecework
      ? Number(calculateEntryMoney(entry, fallback).amountMinor)
      : null,
    currency,
    kind: entry.entry_kind ?? 'real',
  }
}

export const UNASSIGNED_PROJECT_ID = '__unassigned'
