'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import type { Client, Project, WorkEntry } from '@/lib/types'
import { workedEntriesInRange, todayKey, resolveRange } from '../lib/analytics'
import type { ReportsFilters } from '../lib/types'
import type { DateKey } from '../lib/date-keys'

type Params = {
  workEntries: WorkEntry[]
  clients:     Client[]
  projects:    Project[]
  filters:     ReportsFilters
  today:       DateKey | null
}

function escapeCsv(value: string | number): string {
  const s = String(value)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type UseReportsExportReturn = {
  exportCsv:  () => void
  exportJson: () => void
}

export function useReportsExport({
  workEntries,
  clients,
  projects,
  filters,
  today,
}: Params): UseReportsExportReturn {
  const buildEntries = useCallback(() => {
    const t     = today ?? todayKey()
    const range = resolveRange(filters.preset, t, filters.from, filters.to)
    const rows  = workedEntriesInRange(workEntries, filters, t)
    return { range, rows }
  }, [workEntries, filters, today])

  const exportCsv = useCallback(() => {
    try {
      const { range, rows } = buildEntries()
      const clientById  = new Map(clients .map((c) => [c.id, c.name]))
      const projectById = new Map(projects.map((p) => [p.id, p.name]))

      const lines = [
        'Data,Klient,Projekt,Godziny,Tagi',
        ...rows.map((e) =>
          [
            e.date,
            clientById .get(e.client_id  ?? '') ?? '—',
            projectById.get(e.project_id ?? '') ?? '—',
            e.hours ?? 0,
            e.tags.join('|'),
          ]
            .map(escapeCsv)
            .join(','),
        ),
      ].join('\n')

      // BOM dla poprawnego otwarcia w Excelu (PL-locale).
      download(`﻿${lines}`, `reports_${range.start}_${range.end}.csv`, 'text/csv;charset=utf-8;')
      toast.success('Eksport CSV gotowy')
    } catch {
      toast.error('Nie udało się wygenerować CSV')
    }
  }, [buildEntries, clients, projects])

  const exportJson = useCallback(() => {
    try {
      const { range, rows } = buildEntries()
      download(
        JSON.stringify(rows, null, 2),
        `reports_${range.start}_${range.end}.json`,
        'application/json',
      )
      toast.success('Eksport JSON gotowy')
    } catch {
      toast.error('Nie udało się wygenerować JSON')
    }
  }, [buildEntries])

  return { exportCsv, exportJson }
}

export function uniqueTags(entries: WorkEntry[]): string[] {
  return Array.from(new Set(entries.flatMap((e) => e.tags))).sort()
}
