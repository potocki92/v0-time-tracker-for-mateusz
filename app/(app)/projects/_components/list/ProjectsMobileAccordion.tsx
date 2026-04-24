'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Client, type Project, type WorkEntry } from '@/lib/types'
import { selectProgressByProject } from '../../_domain/projects.selectors'
import type { ProjectPriority, ProjectStatusFilter } from '../../_domain/projects.types'
import { ProjectMobileCard } from './ProjectMobileCard'
import { ProjectsMobileFilters } from './ProjectsMobileFilters'

type ProjectsMobileAccordionProps = {
  data: Project[]
  clients: Client[]
  workEntries?: WorkEntry[]
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

type PriorityFilter = 'all' | ProjectPriority

export function ProjectsMobileAccordion({
  data,
  clients,
  workEntries = [],
  onEditProject,
  onDeleteProject,
}: ProjectsMobileAccordionProps) {
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )
  const progressById = useMemo(
    () => selectProgressByProject(data, workEntries),
    [data, workEntries],
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')

  const filteredProjects = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    return data.filter((project) => {
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
      if (!matchesStatus || !matchesPriority) return false
      if (!searchTerm) return true

      const clientName = project.client_id ? clientsById.get(project.client_id)?.name : ''
      const haystack = [
        project.name,
        project.description ?? '',
        clientName ?? '',
        PROJECT_STATUS_LABELS[project.status],
        PRIORITY_LABELS[project.priority],
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(searchTerm)
    })
  }, [clientsById, data, priorityFilter, search, statusFilter])

  const toggleSelection = (projectId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(projectId) ? prev : [...prev, projectId]
      return prev.filter((id) => id !== projectId)
    })
  }

  const removeSelected = () => {
    if (!selectedIds.length) return
    data
      .filter((project) => selectedIds.includes(project.id))
      .forEach((project) => onDeleteProject(project))
    setSelectedIds([])
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  const selectedVisibleCount = filteredProjects.filter((project) =>
    selectedIds.includes(project.id),
  ).length
  const hasActiveFilters =
    statusFilter !== 'all' || priorityFilter !== 'all' || search.length > 0

  return (
    <div className="space-y-3">
      <Card className="border-border/60 py-0 shadow-sm">
        <CardContent className="space-y-2.5 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj projektu, klienta..."
              className="h-11 pl-9 pr-10"
              aria-label="Szukaj projektu"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Wyczyść wyszukiwanie"
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <ProjectsMobileFilters
            status={statusFilter}
            priority={priorityFilter}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
            onReset={resetFilters}
          />
        </CardContent>
      </Card>

      {selectedIds.length > 0 ? (
        <Card className="border-destructive/30 bg-destructive/5 py-0 shadow-none">
          <CardContent className="flex items-center justify-between gap-3 p-3">
            <p className="min-w-0 text-sm text-muted-foreground">
              Zaznaczono:{' '}
              <span className="font-semibold text-foreground">{selectedIds.length}</span>
              {selectedVisibleCount !== selectedIds.length ? (
                <span className="ml-1 text-xs">(widoczne: {selectedVisibleCount})</span>
              ) : null}
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-10 shrink-0"
              onClick={removeSelected}
            >
              Usuń
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {filteredProjects.length === 0 ? (
        <Card className="border-border/60 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Brak projektów spełniających kryteria.
            </p>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetFilters()
                  setSearch('')
                }}
              >
                Wyczyść filtry
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {filteredProjects.map((project) => {
            const clientName = project.client_id
              ? clientsById.get(project.client_id)?.name
              : undefined
            return (
              <li key={project.id}>
                <ProjectMobileCard
                  project={project}
                  clientName={clientName}
                  selected={selectedIds.includes(project.id)}
                  progress={progressById.get(project.id)}
                  onToggleSelect={(checked) => toggleSelection(project.id, checked)}
                  onEdit={() => onEditProject(project)}
                  onDelete={() => onDeleteProject(project)}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
