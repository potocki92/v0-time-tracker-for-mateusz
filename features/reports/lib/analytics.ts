import type { Client, Project, WorkEntry } from '@/lib/types'
import { daysBetween, getDateKey, isWithin, offsetDateKey, type DateKey } from './date-keys'
import type { DateRange, PeriodPreset, ProjectUsage, ReportSummary, ReportsFilters } from './types'

const PRESET_LABELS: Record<Exclude<PeriodPreset, 'custom'>, string> = {
  '7d':  'Ostatnie 7 dni',
  '30d': 'Ostatnie 30 dni',
  '90d': 'Ostatnie 90 dni',
}

const PRESET_DAYS: Record<Exclude<PeriodPreset, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

export function resolveRange(
  preset: PeriodPreset,
  today: DateKey,
  from: DateKey,
  to: DateKey,
): DateRange {
  if (preset === 'custom') {
    const start = from <= to ? from : to
    const end   = from <= to ? to   : from
    return { start, end, label: `${start} – ${end}` }
  }
  const days = PRESET_DAYS[preset]
  return {
    start: offsetDateKey(today, -(days - 1)),
    end:   today,
    label: PRESET_LABELS[preset],
  }
}

function resolveProjectLabel(
  entry:    WorkEntry,
  clients:  Pick<Client,  'id' | 'name'>[],
  projects: Pick<Project, 'id' | 'name'>[],
): string {
  const c = entry.client_id  ? clients.find((x)  => x.id === entry.client_id)?.name  : null
  const p = entry.project_id ? projects.find((x) => x.id === entry.project_id)?.name : null
  return [c, p].filter(Boolean).join(' / ') || 'Bez przypisania'
}

function applyFilters(
  entries: WorkEntry[],
  filters: Pick<ReportsFilters, 'clientId' | 'projectId' | 'tag'>,
): WorkEntry[] {
  return entries.filter((e) => {
    if (filters.clientId  !== 'all' && e.client_id  !== filters.clientId)  return false
    if (filters.projectId !== 'all' && e.project_id !== filters.projectId) return false
    if (filters.tag       !== 'all' && !e.tags.includes(filters.tag))      return false
    return true
  })
}

function sumHours(entries: WorkEntry[]): number {
  return entries.reduce((s, e) => s + (e.hours ?? 0), 0)
}

export function computeReportSummary(
  workEntries: WorkEntry[],
  clients:     Pick<Client,  'id' | 'name'>[],
  projects:    Pick<Project, 'id' | 'name'>[],
  filters:     ReportsFilters,
  todayKey:    DateKey,
): ReportSummary {
  const range = resolveRange(filters.preset, todayKey, filters.from, filters.to)
  const span  = daysBetween(range.start, range.end) + 1
  const prev  = {
    start: offsetDateKey(range.start, -span),
    end:   offsetDateKey(range.start, -1),
  }

  const filtered = applyFilters(workEntries, filters)
  const inRange  = filtered.filter((e) => isWithin(e.date, range.start, range.end))
  const inPrev   = filtered.filter((e) => isWithin(e.date, prev.start,  prev.end))

  const worked     = inRange.filter((e) => e.status === 'worked')
  const prevWorked = inPrev .filter((e) => e.status === 'worked')

  const totalHours = sumHours(worked)
  const activeDays = new Set(worked.map((e) => e.date)).size
  const billable   = worked.reduce(
    (s, e) => s + ((e.billing_rate ?? 0) > 0 ? (e.hours ?? 0) : 0),
    0,
  )

  const byProject = worked.reduce<Record<string, number>>((acc, e) => {
    const label = resolveProjectLabel(e, clients, projects)
    acc[label] = (acc[label] ?? 0) + (e.hours ?? 0)
    return acc
  }, {})

  const projectUsage: ProjectUsage[] = Object.entries(byProject)
    .map(([label, hours]) => ({
      label,
      hours,
      share: totalHours ? (hours / totalHours) * 100 : 0,
    }))
    .sort((a, b) => b.hours - a.hours)

  return {
    range,
    prevRange:       prev,
    totalHours,
    prevHours:       sumHours(prevWorked),
    avgPerActiveDay: activeDays ? totalHours / activeDays : 0,
    billableRatio:   totalHours ? (billable / totalHours) * 100 : 0,
    projectUsage,
    workedCount:     worked.length,
  }
}

export function workedEntriesInRange(
  workEntries: WorkEntry[],
  filters:     ReportsFilters,
  todayKey:    DateKey,
): WorkEntry[] {
  const range = resolveRange(filters.preset, todayKey, filters.from, filters.to)
  return applyFilters(workEntries, filters).filter(
    (e) => e.status === 'worked' && isWithin(e.date, range.start, range.end),
  )
}

export function todayKey(): DateKey {
  return getDateKey(new Date())
}
