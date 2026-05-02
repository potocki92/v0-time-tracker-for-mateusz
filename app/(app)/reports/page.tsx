'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Filter, TrendingUp } from 'lucide-react'
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData'
import type { WorkEntry } from '@/lib/types'

type PeriodPreset = '7d' | '30d' | '90d' | 'custom'

export default function ReportsPage() {
  const { data } = useDashboardData()
  const [todayKey, setTodayKey] = useState<string | null>(null)
  const [preset, setPreset] = useState<PeriodPreset>('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [clientId, setClientId] = useState('all')
  const [projectId, setProjectId] = useState('all')
  const [tag, setTag] = useState('all')
  const [compare, setCompare] = useState(false)

  useEffect(() => {
    const now = getDateKey(new Date())
    setTodayKey(now)
    setTo(now)
    setFrom(offsetDateKey(now, -29))
  }, [])

  const tags = useMemo(() => Array.from(new Set(data.workEntries.flatMap((e) => e.tags))).sort(), [data.workEntries])

  const report = useMemo(() => {
    const now = todayKey ?? getDateKey(new Date())
    const { start, end, label } = resolveRange(preset, now, from, to)
    const span = daysBetween(start, end) + 1
    const prev = { start: offsetDateKey(start, -span), end: offsetDateKey(start, -1) }

    const filterBase = (entry: WorkEntry) => {
      if (clientId !== 'all' && entry.client_id !== clientId) return false
      if (projectId !== 'all' && entry.project_id !== projectId) return false
      if (tag !== 'all' && !entry.tags.includes(tag)) return false
      return true
    }

    const entries = data.workEntries.filter((e) => isWithin(e.date, start, end) && filterBase(e))
    const worked = entries.filter((e) => e.status === 'worked')

    const previousWorked = data.workEntries.filter((e) => e.status === 'worked' && isWithin(e.date, prev.start, prev.end) && filterBase(e))

    const total = sumHours(worked)
    const previousTotal = sumHours(previousWorked)
    const avg = worked.length ? total / new Set(worked.map((e) => e.date)).size : 0
    const billable = worked.reduce((s, e) => s + (e.billing_rate && e.billing_rate > 0 ? e.hours ?? 0 : 0), 0)
    const byProject = worked.reduce<Record<string, number>>((acc, e) => {
      const label = resolveProjectLabel(e, data.clients, data.projects)
      acc[label] = (acc[label] ?? 0) + (e.hours ?? 0)
      return acc
    }, {})

    const projectUsage = Object.entries(byProject)
      .map(([label, hours]) => ({ label, hours, share: total ? (hours / total) * 100 : 0 }))
      .sort((a, b) => b.hours - a.hours)

    return { start, end, label, prev, worked, total, previousTotal, avg, billableRatio: total ? (billable / total) * 100 : 0, projectUsage }
  }, [clientId, data.clients, data.projects, data.workEntries, from, preset, projectId, tag, to, todayKey])

  const exportCsv = () => {
    const rows = report.worked.map((e) => {
      const client = data.clients.find((c) => c.id === e.client_id)?.name ?? '—'
      const project = data.projects.find((p) => p.id === e.project_id)?.name ?? '—'
      return [e.date, client, project, e.hours ?? 0, e.tags.join('|')]
    })
    const csv = ['Data,Klient,Projekt,Godziny,Tagi', ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n')
    download(`\uFEFF${csv}`, `reports_${report.start}_${report.end}.csv`, 'text/csv;charset=utf-8;')
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Raporty</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <select value={preset} onChange={(e) => setPreset(e.target.value as PeriodPreset)} className="bg-zinc-900 border border-white/20 rounded p-2">
          <option value="7d">Ostatnie 7 dni</option><option value="30d">Ostatnie 30 dni</option><option value="90d">Ostatnie 90 dni</option><option value="custom">Własny zakres</option>
        </select>
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('custom') }} className="bg-zinc-900 border border-white/20 rounded p-2" />
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('custom') }} className="bg-zinc-900 border border-white/20 rounded p-2" />
        <button onClick={() => setCompare((v) => !v)} className="rounded p-2 border border-white/20 bg-zinc-900"><TrendingUp className="inline size-4 mr-2"/>Porównanie: {compare ? 'ON' : 'OFF'}</button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="bg-zinc-900 border border-white/20 rounded p-2"><option value="all">{`Wszyscy klienci`}</option>{data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="bg-zinc-900 border border-white/20 rounded p-2"><option value="all">Wszystkie projekty</option>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} className="bg-zinc-900 border border-white/20 rounded p-2"><option value="all">Wszystkie tagi</option>{tags.map((t) => <option key={t} value={t}>{t}</option>)}</select>
      </div>
      <div className="flex gap-2"><button onClick={exportCsv} className="rounded p-2 border border-white/20 bg-zinc-900"><Download className="inline size-4 mr-2"/>Eksport CSV</button><button onClick={() => download(JSON.stringify(report.worked, null, 2), `reports_${report.start}_${report.end}.json`, 'application/json')} className="rounded p-2 border border-white/20 bg-zinc-900">Eksport JSON</button></div>
      <div className="grid md:grid-cols-3 gap-3">
        <Kpi label="Zakres" value={report.label} icon={Filter} />
        <Kpi label="Łączny czas" value={`${report.total.toFixed(1)}h`} delta={compare ? report.previousTotal : undefined} />
        <Kpi label="Billable" value={`${Math.round(report.billableRatio)}%`} />
      </div>
      <div className="rounded border border-white/10 bg-zinc-950/80 p-4 space-y-2">
        {report.projectUsage.length ? report.projectUsage.map((p) => <Bar key={p.label} label={p.label} value={p.share} />) : <p>Brak danych</p>}
      </div>
    </div>
  )
}

function Kpi({ label, value, delta }: { label: string; value: string; delta?: number; icon?: unknown }) { return <div className="rounded border border-white/10 bg-zinc-950/80 p-4"><p className="text-xs text-zinc-400">{label}</p><p className="text-xl">{value}</p>{delta !== undefined ? <p className="text-xs text-zinc-500">Poprzednio: {delta.toFixed(1)}h</p> : null}</div> }
function Bar({ label, value }: { label: string; value: number }) { return <div><div className="text-xs flex justify-between"><span>{label}</span><span>{Math.round(value)}%</span></div><div className="h-2 bg-zinc-800 rounded"><div className="h-2 bg-zinc-300 rounded" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div> }
function resolveRange(p: PeriodPreset, today: string, from: string, to: string) { if (p === '7d') return { start: offsetDateKey(today, -6), end: today, label: 'Ostatnie 7 dni' }; if (p === '30d') return { start: offsetDateKey(today, -29), end: today, label: 'Ostatnie 30 dni' }; if (p === '90d') return { start: offsetDateKey(today, -89), end: today, label: 'Ostatnie 90 dni' }; const start = from <= to ? from : to; const end = from <= to ? to : from; return { start, end, label: `${start} – ${end}` } }
function resolveProjectLabel(entry: WorkEntry, clients: Array<{ id: string; name: string }>, projects: Array<{ id: string; name: string }>) { const c = entry.client_id ? clients.find((x) => x.id === entry.client_id)?.name : null; const p = entry.project_id ? projects.find((x) => x.id === entry.project_id)?.name : null; return [c, p].filter(Boolean).join(' / ') || 'Bez przypisania' }
function sumHours(entries: WorkEntry[]) { return entries.reduce((s, e) => s + (e.hours ?? 0), 0) }
function getDateKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function offsetDateKey(key: string, days: number) { const [y, m, d] = key.split('-').map(Number); const date = new Date(y, m - 1, d); date.setDate(date.getDate() + days); return getDateKey(date) }
function isWithin(date: string, start: string, end: string) { return date >= start && date <= end }
function daysBetween(start: string, end: string) { const [sy, sm, sd] = start.split('-').map(Number); const [ey, em, ed] = end.split('-').map(Number); return Math.round((new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) / 86400000) }
function escapeCsv(v: string | number) { const s = String(v); return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s }
function download(content: string, filename: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }
