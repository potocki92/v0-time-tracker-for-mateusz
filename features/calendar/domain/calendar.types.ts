import type { Client, CURRENCY, Project, WorkEntry } from '@/lib/types'

export type WorkStatus =
  | 'worked'
  | 'not_worked'
  | 'vacation'
  | 'sick_leave'
  | 'day_off'

export type CalendarView = 'month' | 'list'

export type CalendarData = {
  clients: Client[]
  projects: Project[]
  workEntries: WorkEntry[]
}

export type UseCalendarDataReturn = {
  loading: boolean
  data: CalendarData
}

export type CalendarStats = {
  totalHours: number
  /** Godziny już zrealizowane (wpisy `real` do dziś włącznie). */
  realizedHours: number
  /** Godziny zaplanowane (wpisy `predicted` lub przyszłe). */
  predictedHours: number
  /** Suma zarobków: zrealizowane + zaplanowane. */
  totalEarningsPLN: number
  /** Zaplanowany zarobek (przyszłe / `predicted`). */
  predictedEarningsPLN: number
  /** Zrealizowany zarobek (wpisy `real` do dziś). */
  realizedEarningsPLN: number
  /** Udział zrealizowanego zarobku w sumie, 0..100. */
  realizedSharePercent: number
  workDays: number
  /** Dni już zrealizowane. */
  realizedDays: number
  /** Dni zaplanowane (przyszłe / `predicted`). */
  predictedDays: number
  freeDays: number
  absences: number
  progressPercent: number
  baselineHours: number
  isAhead: boolean
}

/**
 * Aktywny "streak" — ile dni z rzędu user pracował (pomijając weekendy).
 * `longestThisYear` służy karcie "Active Streak" w nowym dashboardzie.
 */
export type ActiveStreak = {
  current: number
  longestThisYear: number
}

/**
 * Pojedynczy słupek wykresu "Hours per Week".
 */
export type WeeklyHoursBar = {
  /** Numer ISO-tygodnia, np. "W17" */
  label: string
  /** Pełen klucz "2026-W17" — używany jako React key */
  key: string
  hours: number
  isCurrent: boolean
}

/**
 * Agregat czasu/zarobków dla pojedynczego klienta w miesiącu.
 */
export type ProjectAggregate = {
  clientId: string
  clientName: string
  color: string
  hours: number
  amountPLN: number
  amountNative: number
  currency: CURRENCY
  shareOfHours: number // 0..1
}

/**
 * Rozbicie kompozycji miesiąca na typy dni — używane w pasku "Day composition".
 */
export type DayCompositionBreakdown = {
  totalDays: number
  worked: number
  pto: number // vacation
  sick: number
  off: number // day_off + not_worked
  weekend: number
}

export type RecentEntry = {
  id: string
  date: string
  clientName: string | null
  notes: string | null
  hours: number
  amountPLN: number
  currency: CURRENCY
  amountNative: number
}

export type CalendarInsights = {
  weekly: WeeklyHoursBar[]
  weeklyTotalHours: number
  weeklyAvgHours: number
  weeklyPeak: { hours: number; date: string } | null
  byProject: ProjectAggregate[]
  composition: DayCompositionBreakdown
  recent: RecentEntry[]
}

export type EntryFormValues = {
  entryKind: 'real' | 'predicted'
  status: WorkStatus
  clientId: string
  projectId: string
  hours: number
  quantityFrom: number
  quantityTo: number
  notes: string
}

export type EntryMutationPayload = EntryFormValues & {
  date: string
  existingId?: string
}

export type StatusVisualConfig = {
  label: string
  dot: string
  border: string
  bg: string
  pill: string
  badge: string
}
