'use client'

import { Plus, Upload } from 'lucide-react'
import { WorkspaceHeaderActions } from '@/components/workspace/workspace-header-slot'
import { Button } from '@/components/ui/button'

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
        <Button variant="outline" size="sm" onClick={onExport}>
          <Upload className="h-3.5 w-3.5" aria-hidden />
          Export
        </Button>
      )}
      {onCreate && (
        <Button variant="accent" size="sm" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nowy projekt
        </Button>
      )}
    </WorkspaceHeaderActions>
  )
}
