import type { DateKey } from './date-keys'

export type PeriodPreset = '7d' | '30d' | '90d' | 'custom'

export type ReportsFilters = {
  preset:    PeriodPreset
  from:      DateKey
  to:        DateKey
  clientId:  string
  projectId: string
  tag:       string
  compare:   boolean
}

export type DateRange = {
  start: DateKey
  end:   DateKey
  label: string
}

export type ProjectUsage = {
  label: string
  hours: number
  share: number // 0..100
}

export type ReportSummary = {
  range:         DateRange
  prevRange:     { start: DateKey; end: DateKey }
  totalHours:    number
  prevHours:     number
  avgPerActiveDay: number
  billableRatio: number // 0..100
  projectUsage:  ProjectUsage[]
  workedCount:   number
}
