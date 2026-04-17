import type { Client, Project, WorkEntry } from '@/lib/types'

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
  forecastPLN: number
  workDays: number
  freeDays: number
  absences: number
  progressPercent: number
  baselineHours: number
  isAhead: boolean
}

export type EntryFormValues = {
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
