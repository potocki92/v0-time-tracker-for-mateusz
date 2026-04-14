'use client'

/**
 * Plik: src/app/(app)/dashboard/_components/ExportButton.tsx
 *
 * Dropdown z opcjami CSV i PDF.
 * Użycie w nagłówku dashboardu obok selektora zakresu dat.
 */

import { useState, useRef, useEffect } from 'react'
import { DownloadIcon, FileTextIcon, TableIcon } from 'lucide-react'
import { useExportData } from '@/hooks/useExportData'
import type { WorkEntry, Client } from '@/lib/types'
import { TimeRange } from '../../_domain'
import { selectEurRate, usePreferencesStore } from '../../_hooks/usePreferencesStore'
import { usePeriodLabel } from '../../_hooks'

interface ExportButtonProps {
  entries:   WorkEntry[]
  clients:   Client[]
  timeRange: TimeRange
}

export function ExportButton({ entries, clients, timeRange }: ExportButtonProps) {
  const eurRate     = usePreferencesStore(selectEurRate)
  const periodLabel = usePeriodLabel(timeRange)

  const [open, setOpen] = useState(false)
  const dropdownRef     = useRef<HTMLDivElement>(null)

  const { exportCSV, exportPDF, isExporting } = useExportData({
    entries,
    clients,
    eurRate,
    periodLabel,
  })

  // Zamknij dropdown po kliknięciu poza nim
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isExporting}
        className="
          flex items-center gap-1.5 rounded-xl border border-zinc-200
          bg-white px-3 py-2 text-sm font-medium text-zinc-700
          hover:bg-zinc-50 disabled:opacity-50
          dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800
        "
        aria-haspopup="true"
        aria-expanded={open}
      >
        <DownloadIcon className="h-4 w-4" />
        {isExporting ? 'Generuję...' : 'Eksport'}
      </button>

      {open && (
        <div
          role="menu"
          className="
            absolute right-0 top-full z-50 mt-1.5
            min-w-[160px] rounded-xl border border-zinc-100 bg-white
            p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900
          "
        >
          <button
            role="menuitem"
            onClick={() => { exportCSV(); setOpen(false) }}
            className="
              flex w-full items-center gap-2.5 rounded-lg px-3 py-2
              text-sm text-zinc-700 hover:bg-zinc-50
              dark:text-zinc-200 dark:hover:bg-zinc-800
            "
          >
            <TableIcon className="h-4 w-4 text-emerald-500" />
            Eksportuj CSV
          </button>

          <button
            role="menuitem"
            onClick={() => { void exportPDF(); setOpen(false) }}
            className="
              flex w-full items-center gap-2.5 rounded-lg px-3 py-2
              text-sm text-zinc-700 hover:bg-zinc-50
              dark:text-zinc-200 dark:hover:bg-zinc-800
            "
          >
            <FileTextIcon className="h-4 w-4 text-red-500" />
            Eksportuj PDF
          </button>
        </div>
      )}
    </div>
  )
}