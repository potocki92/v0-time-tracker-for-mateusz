'use client'

import { Plus, Upload } from 'lucide-react'
import { WorkspaceHeaderActions } from '@/components/workspace/workspace-header-slot'
import { cn } from '@/lib/utils'
import { LINEAR } from '../linear/linear.tokens'

type HeaderSectionProps = {
  onCreate?: () => void
  onExport?: () => void
}

/**
 * Akcje modułu Projekty. Renderują się przez portal w `WorkspaceHeader`,
 * więc przycisk stoi w jednym pasku z breadcrumbem, a nie luzem nad treścią.
 */
export function HeaderSection({ onCreate, onExport }: HeaderSectionProps) {
  if (!onCreate && !onExport) return null

  return (
    <WorkspaceHeaderActions>
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
    </WorkspaceHeaderActions>
  )
}
