'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PROJECT_STATUS_FILTER_OPTIONS } from '../../types/projects.constants'
import { useProjectsData } from '../../hooks/useProjectsData'
import { useProjectsFilters } from '../../hooks/useProjectsFilters'
import { LinearCard } from '../linear/LinearCard'
import { LINEAR } from '../linear/linear.tokens'
import { ProjectDetailsPanel } from '../linear/ProjectDetailsPanel'
import { ProjectListRow } from '../linear/ProjectListRow'

type AllProjectsSectionProps = {
  onEditProject?: (project: Project) => void
  onDeleteProject?: (project: Project) => void
}

export function AllProjectsSection({
  onEditProject,
  onDeleteProject,
}: AllProjectsSectionProps) {
  const { data } = useProjectsData()
  const { search, status, setSearch, setStatus, reset, isFiltering, rows, totalRows } =
    useProjectsFilters(data)

  // Zaznaczenie trzymamy po id, nie jako obiekt — dzięki temu drawer pokazuje
  // świeże dane po edycji projektu i sam się zamyka, gdy projekt wypadnie z filtrów.
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const selectedRow = rows.find((row) => row.project.id === selectedProjectId) ?? null

  return (
    <LinearCard
      eyebrow="Wszystkie projekty"
      badge={
        <span className="rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-0.5 text-[11px] text-zinc-300">
          {rows.length} z {totalRows}
        </span>
      }
      trailing={
        isFiltering && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition hover:bg-[#141414] hover:text-white"
          >
            <X className="h-3 w-3" aria-hidden />
            Reset
          </button>
        )
      }
    >
      <div className="space-y-3 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-1">
          {PROJECT_STATUS_FILTER_OPTIONS.map((option) => {
            const isActive = status === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-medium transition',
                  isActive
                    ? 'bg-white text-black'
                    : 'border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-300 hover:border-zinc-700 hover:text-white',
                )}
                aria-pressed={isActive}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Szukaj projektu, klienta, opisu..."
            aria-label="Szukaj projektów"
            className={cn(
              'h-9 w-full rounded-lg border bg-[#0c0c0c] px-9 text-[13px] text-white placeholder:text-zinc-600',
              LINEAR.border,
              'focus:border-zinc-600 focus:outline-none',
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition hover:bg-[#141414] hover:text-white"
              aria-label="Wyczyść wyszukiwanie"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 pb-5 pt-2 text-center text-sm text-zinc-500 sm:px-5">
          Żaden projekt nie pasuje do bieżących filtrów.
        </div>
      ) : (
        <ul role="list" className="space-y-2 px-4 pb-4 sm:px-5">
          {rows.map((row) => (
            <ProjectListRow
              key={row.project.id}
              row={row}
              onSelect={() => setSelectedProjectId(row.project.id)}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
            />
          ))}
        </ul>
      )}

      {/* Renderuje się przez portal, więc miejsce w drzewie nie ma znaczenia. */}
      <Sheet
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) setSelectedProjectId(null)
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Szczegóły projektu</SheetTitle>
          </SheetHeader>
          {selectedRow && (
            <div className="px-2 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
              <ProjectDetailsPanel
                row={selectedRow}
                onEdit={() => {
                  setSelectedProjectId(null)
                  onEditProject?.(selectedRow.project)
                }}
                onDelete={() => {
                  setSelectedProjectId(null)
                  onDeleteProject?.(selectedRow.project)
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </LinearCard>
  )
}
