'use client'

import { Fragment, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  PROJECT_STATUS_FILTER_OPTIONS,
  PROJECT_STATUS_GROUP_LABELS,
} from '../../types/projects.constants'
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

  // Wiersze przychodzą już posortowane statusami (STATUS_ORDER w selektorze),
  // więc grupy wykrywamy zwykłą zmianą statusu względem poprzedniego wiersza.
  const countsByStatus = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.project.status] = (acc[row.project.status] ?? 0) + 1
    return acc
  }, {})
  const showGroups = Object.keys(countsByStatus).length > 1

  return (
    <LinearCard
      eyebrow="Wszystkie projekty"
      badge={
        <span
          className={cn(
            'rounded-md border px-2 py-0.5 text-2xs text-zinc-300',
            LINEAR.border,
            LINEAR.surfaceElevated,
          )}
        >
          {rows.length} z {totalRows}
        </span>
      }
      trailing={
        isFiltering && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-zinc-300 transition hover:bg-[#212126] hover:text-white"
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
                  'inline-flex min-h-9 items-center rounded-full px-3.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-white text-black'
                    : cn(
                        'border text-zinc-300 hover:border-zinc-600 hover:text-white',
                        LINEAR.border,
                        LINEAR.surfaceElevated,
                      ),
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
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Szukaj projektu, klienta, opisu..."
            aria-label="Szukaj projektów"
            className={cn(
              'h-11 w-full rounded-lg border px-10 text-sm text-white placeholder:text-zinc-400',
              LINEAR.border,
              LINEAR.surfaceElevated,
              'focus:border-zinc-500 focus:outline-none',
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-[#212126] hover:text-white"
              aria-label="Wyczyść wyszukiwanie"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 pb-5 pt-2 text-center text-sm text-zinc-400 sm:px-5">
          Żaden projekt nie pasuje do bieżących filtrów.
        </div>
      ) : (
        <ul role="list" className="space-y-2 px-4 pb-4 sm:px-5">
          {rows.map((row, index) => {
            const status = row.project.status
            const startsGroup = showGroups && rows[index - 1]?.project.status !== status
            return (
              <Fragment key={row.project.id}>
                {startsGroup && (
                  <GroupHeading label={PROJECT_STATUS_GROUP_LABELS[status]} count={countsByStatus[status]} />
                )}
                <ProjectListRow
                  row={row}
                  onSelect={() => setSelectedProjectId(row.project.id)}
                />
              </Fragment>
            )
          })}
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
          className={cn(
            'max-h-[90dvh] overflow-y-auto rounded-t-2xl border p-0',
            LINEAR.border,
            LINEAR.surface,
          )}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Szczegóły projektu</SheetTitle>
          </SheetHeader>
          {selectedRow && (
            <div className="px-2 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
              {/* Panel zostaje otwarty pod spodem — formularz i potwierdzenie
                  usunięcia wychodzą jako druga warstwa nad nim. Po usunięciu
                  projekt wypada z `rows`, więc panel zamyka się sam. */}
              <ProjectDetailsPanel
                row={selectedRow}
                onEdit={() => onEditProject?.(selectedRow.project)}
                onDelete={() => onDeleteProject?.(selectedRow.project)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </LinearCard>
  )
}

/**
 * Separator grupy statusów wewnątrz listy. Bez niego 1 aktywny projekt ginie
 * w stosie 6 zakończonych, bo wszystkie wiersze wyglądają tak samo.
 */
function GroupHeading({ label, count }: { label: string; count: number }) {
  return (
    <li className="flex items-center gap-2 pb-0.5 pt-3 first:pt-0">
      <p className={LINEAR.eyebrow}>{label}</p>
      <span className="text-2xs font-semibold tabular-nums text-zinc-400">{count}</span>
      <span aria-hidden className={cn('h-px flex-1 border-t', LINEAR.borderInset)} />
    </li>
  )
}
