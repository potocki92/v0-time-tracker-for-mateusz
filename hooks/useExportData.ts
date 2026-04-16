'use client'

/**
 * #19 — Eksport CSV/PDF zarobków
 *
 * Plik: src/hooks/useExportData.ts
 *
 * CSV: generowany w przeglądarce bez bibliotek — Blob + URL.createObjectURL
 * PDF: używa @react-pdf/renderer (SSR-safe, brak Puppeteer)
 *
 * Install: npm install @react-pdf/renderer
 */

import { useCallback, useState } from 'react'
import type { WorkEntry, Client } from '@/lib/types'
import { calculateEarnings } from '@/lib/finance/earnings'

// ── Typy ──────────────────────────────────────────────────────────────────────

export interface ExportRow {
  date:        string
  client:      string
  project:     string
  hours:       number
  earningsPLN: number
  earningsEUR: number
  status:      string
}

interface UseExportDataOptions {
  entries:      WorkEntry[]
  clients:      Client[]
  eurRate:      number
  periodLabel:  string
}

interface UseExportDataReturn {
  exportCSV:    () => void
  exportPDF:    () => Promise<void>
  isExporting:  boolean
}

// ── CSV helper ────────────────────────────────────────────────────────────────

function buildRows(
  entries: WorkEntry[],
  clients: Client[],
  eurRate: number,
): ExportRow[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]))

  return entries
    .filter((e) => e.status === 'worked')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      const client   = entry.client_id ? clientMap.get(entry.client_id) : undefined
      const earnings = calculateEarnings(entry, client, eurRate)

      return {
        date:        entry.date,
        client:      client?.name        ?? '—',
        project:     entry.project_id    ?? '—',
        hours:       entry.hours         ?? 0,
        earningsPLN: Number(earnings.amountInPLN.toFixed(2)),
        earningsEUR: Number(earnings.amountInEUR.toFixed(2)),
        status:      entry.status,
      }
    })
}

function rowsToCSV(rows: ExportRow[]): string {
  const headers = ['Data', 'Klient', 'Projekt', 'Godziny', 'Zarobki PLN', 'Zarobki EUR']

  const escape = (v: string | number) => {
    const str = String(v)
    // Escapuj przecinki i cudzysłowy
    return str.includes(',') || str.includes('"')
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }

  const dataRows = rows.map((r) =>
    [r.date, r.client, r.project, r.hours, r.earningsPLN, r.earningsEUR]
      .map(escape)
      .join(',')
  )

  // BOM dla poprawnego wyświetlania polskich znaków w Excel
  return '\uFEFF' + [headers.join(','), ...dataRows].join('\n')
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useExportData({
  entries,
  clients,
  eurRate,
  periodLabel,
}: UseExportDataOptions): UseExportDataReturn {
  const [isExporting, setIsExporting] = useState(false)

  const exportCSV = useCallback(() => {
    const rows     = buildRows(entries, clients, eurRate)
    const csv      = rowsToCSV(rows)
    const filename = `zarobki_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`

    downloadBlob(csv, filename, 'text/csv;charset=utf-8;')
  }, [entries, clients, eurRate, periodLabel])

  const exportPDF = useCallback(async () => {
    setIsExporting(true)

    try {
      // Dynamic import — @react-pdf/renderer jest duży, ładuj tylko gdy potrzeba
      const { pdf }           = await import('@react-pdf/renderer')
      const { EarningsReport } = await import('../app/(app)/dashboard/_components/export/EarningsReport')

      const rows     = buildRows(entries, clients, eurRate)
      const totals   = {
        totalPLN: rows.reduce((s, r) => s + r.earningsPLN, 0),
        totalEUR: rows.reduce((s, r) => s + r.earningsEUR, 0),
        totalHours: rows.reduce((s, r) => s + r.hours, 0),
      }

      const blob     = await pdf(
        EarningsReport({ rows, totals, periodLabel })
      ).toBlob()

      const url      = URL.createObjectURL(blob)
      const filename = `raport_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
      const a        = document.createElement('a')
      a.href         = url
      a.download     = filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }, [entries, clients, eurRate, periodLabel])

  return { exportCSV, exportPDF, isExporting }
}