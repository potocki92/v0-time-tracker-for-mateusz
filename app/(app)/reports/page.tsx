'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { LineChart, Download, CalendarRange, Filter, TrendingUp } from 'lucide-react'
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData'
import type { WorkEntry } from '@/lib/types'

type ProjectUsage = {
  label: string
  hours: number
  share: number
}

const DAYS_RANGE = 30
const DEFAULT_DAILY_HOURS = 8

export default function ReportsPage() {
  const { data } = useDashboardData()
  const [todayKey, setTodayKey] = useState<string | null>(null)

  useEffect(() => {
    setTodayKey(getLocalDateKey(new Date()))
  }, [])

  const report = useMemo(() => {
    const effectiveTodayKey = todayKey ?? getLocalDateKey(new Date())
    const rangeStartKey = offsetDateKey(effectiveTodayKey, -(DAYS_RANGE - 1))

    const entries = data.workEntries.filter((entry) => isWithinDateRange(entry.date, rangeStartKey, effectiveTodayKey))
    const workedEntries = entries.filter((entry) => entry.status === 'worked')
    const totalHours = workedEntries.reduce((sum, entry) => sum + (entry.hours ?? 0), 0)
    const activeDays = new Set(workedEntries.map((entry) => entry.date)).size
    const averagePerDay = activeDays > 0 ? totalHours / activeDays : 0

    const dailyHours = workedEntries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.date] = (acc[entry.date] ?? 0) + (entry.hours ?? 0)
      return acc
    }, {})

    const overtimeHours = Object.values(dailyHours).reduce((sum, hours) => {
      return sum + Math.max(hours - DEFAULT_DAILY_HOURS, 0)
    }, 0)

    const billableHours = workedEntries.reduce((sum, entry) => {
      if (!isBillable(entry)) return sum
      return sum + (entry.hours ?? 0)
    }, 0)
    const billableRatio = totalHours > 0 ? (billableHours / totalHours) * 100 : 0

    const byProject = workedEntries.reduce<Record<string, number>>((acc, entry) => {
      const key = resolveProjectLabel(entry, data.clients)
      acc[key] = (acc[key] ?? 0) + (entry.hours ?? 0)
      return acc
    }, {})

    const projectUsage: ProjectUsage[] = Object.entries(byProject)
      .map(([label, hours]) => ({
        label,
        hours,
        share: totalHours > 0 ? (hours / totalHours) * 100 : 0,
      }))
      .sort((a, b) => b.hours - a.hours)

    const topProject = projectUsage[0]
    const noEntryDays = DAYS_RANGE - new Set(entries.map((entry) => entry.date)).size

    const insights = [
      topProject
        ? `Najwięcej czasu: ${topProject.label} (${formatPercent(topProject.share)})`
        : 'Brak danych o projektach w wybranym okresie',
      `Czas billable: ${formatPercent(billableRatio)} łącznego czasu worked`,
      `${Math.max(noEntryDays, 0)} dni bez wpisów w ostatnich ${DAYS_RANGE} dniach`,
    ]

    return {
      rangeLabel: `${formatDateKey(rangeStartKey)} – ${formatDateKey(effectiveTodayKey)}`,
      kpis: [
        { label: 'Łączny czas', value: `${formatHours(totalHours)}h` },
        { label: 'Średnio / dzień', value: `${formatHours(averagePerDay)}h` },
        { label: 'Billable', value: formatPercent(billableRatio) },
        { label: 'Nadgodziny', value: `+${formatHours(overtimeHours)}h` },
      ],
      insights,
      projectUsage,
    }
  }, [data.clients, data.workEntries, todayKey])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 pb-24 pt-3 sm:px-4 md:grid-cols-[300px_minmax(0,1fr)] md:px-6 lg:px-8">
        <aside className="rounded-xl border border-white/10 bg-zinc-950/90 p-3 md:sticky md:top-4 md:h-fit">
          <div className="mb-4 border-b border-white/10 pb-3">
            <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Statystyki</p>
            <h1 className="mt-1 text-lg font-semibold">Raporty</h1>
            <p className="text-xs text-zinc-500">{report.rangeLabel}</p>
          </div>

          <div className="space-y-2">
            <SidebarButton icon={CalendarRange} label={`Zakres: ostatnie ${DAYS_RANGE} dni`} />
            <SidebarButton icon={Filter} label="Filtry: projekt, klient, tag" />
            <SidebarButton icon={TrendingUp} label="Porównaj z poprzednim okresem" />
            <SidebarButton icon={Download} label="Eksportuj PDF / CSV" />
          </div>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">Szybkie insighty</p>
            {report.insights.map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-zinc-900/70 p-2 text-xs text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {report.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                <p className="text-xs text-zinc-400">{kpi.label}</p>
                <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-zinc-300">
              <LineChart className="size-4" />
              <h2 className="text-sm font-medium">Rozkład czasu per projekt</h2>
            </div>
            <div className="space-y-2">
              {report.projectUsage.length > 0 ? (
                report.projectUsage.map((project) => (
                  <Bar key={project.label} label={project.label} value={project.share} />
                ))
              ) : (
                <p className="text-sm text-zinc-500">Brak wpisów worked dla bieżącego zakresu.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function resolveProjectLabel(entry: WorkEntry, clients: Array<{ id: string; name: string }>) {
  const client = entry.client_id ? clients.find((item) => item.id === entry.client_id) : null
  const clientName = client?.name ?? (entry.client_id ? `Klient #${entry.client_id.slice(0, 8)}` : null)

  if (entry.project_id) {
    const projectLabel = `Projekt #${entry.project_id.slice(0, 8)}`
    return clientName ? `${clientName} (${projectLabel})` : projectLabel
  }

  if (clientName) return clientName
  return 'Bez przypisania'
}

function isBillable(entry: WorkEntry) {
  return Boolean(entry.billing_rate && entry.billing_rate > 0)
}

function formatHours(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0'
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function offsetDateKey(dateKey: string, offsetDays: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + offsetDays)
  return getLocalDateKey(date)
}

function isWithinDateRange(dateKey: string, startKey: string, endKey: string) {
  return dateKey >= startKey && dateKey <= endKey
}

function SidebarButton({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex w-full items-center gap-2 rounded-md border border-white/10 bg-zinc-900/60 px-2.5 py-2 text-left text-xs text-zinc-300 transition hover:bg-zinc-800/70">
      <Icon className="size-3.5 text-zinc-500" />
      <span>{label}</span>
    </button>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span>{formatPercent(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800">
        <div className="h-2 rounded-full bg-zinc-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}
