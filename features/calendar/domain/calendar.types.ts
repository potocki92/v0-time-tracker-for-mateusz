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

/**
 * Pojedynczy słupek wykresu "Godziny tygodniowo".
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
 * Agregat czasu/zarobków dla pojedynczego projektu w miesiącu.
 */
export type ProjectAggregate = {
  projectId: string
  name: string
  color: string
  hours: number
  amountMinor: number
  /** udział w godzinach miesiąca, 0..1 */
  share: number
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
  weeklyAvgHours: number
  weeklyPeak: WeeklyHoursBar | null
  byProject: ProjectAggregate[]
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

export type StatusVisualConfig = {
  label: string
  dot: string
  border: string
  bg: string
  pill: string
  badge: string
}
