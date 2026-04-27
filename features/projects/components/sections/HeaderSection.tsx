'use client'

import { Plus, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LINEAR } from '../linear/linear.tokens'

type HeaderSectionProps = {
  onCreate?: () => void
  onExport?: () => void
}

/**
 * Slim action bar — celowo bez wielkiego nagłówka i eyebrow,
 * bo nagłówek modułu obsługuje globalny app-shell (sidebar/topbar).
 * Tutaj zostają wyłącznie akcje primary/secondary.
 */
export function HeaderSection({ onCreate, onExport }: HeaderSectionProps) {
  if (!onCreate && !onExport) return null

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-zinc-300 transition',
            LINEAR.border,
            LINEAR.surfaceElevated,
            'hover:border-zinc-600 hover:text-white',
          )}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden />
          Export
        </button>
      )}
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            'bg-emerald-500 text-black hover:bg-emerald-400',
          )}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nowy projekt
        </button>
      )}
    </div>
  )
}
