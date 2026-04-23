'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Flag, Search } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Client, type Project } from '@/lib/types'
import {
  PROJECT_PRIORITY_BADGE_CLASS,
  PROJECT_STATUS_BADGE_CLASS,
} from '../../_domain/projects.constants'
import type { ProjectFiltersState } from '../../_hooks/useProjectFilters'
import { ProjectsFiltersSheet } from './ProjectsFiltersSheet'

type ProjectsMobileAccordionProps = {
  data: Project[]
  clients: Client[]
  filters: ProjectFiltersState
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export function ProjectsMobileAccordion({
  data,
  clients,
  filters,
  onEditProject,
  onDeleteProject,
}: ProjectsMobileAccordionProps) {
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  const selectedVisibleCount = data.filter((project) => selectedIds.includes(project.id)).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filters.search}
            onChange={(event) => filters.setSearch(event.target.value)}
            placeholder="Szukaj projektu, klienta..."
            className="h-11 pl-9"
            aria-label="Szukaj projektu"
          />
        </div>
        <ProjectsFiltersSheet filters={filters} />
      </div>

      {selectedIds.length > 0 && (
        <Card className="border-destructive/30 bg-card/80 py-3">
          <CardContent className="flex items-center justify-between px-4">
            <p className="text-sm text-muted-foreground">
              Zaznaczono: <span className="font-semibold text-foreground">{selectedIds.length}</span>
              {selectedVisibleCount !== selectedIds.length && (
                <span className="ml-1 text-xs">(widoczne: {selectedVisibleCount})</span>
              )}
            </p>
            <Button variant="destructive" size="sm" onClick={removeSelected}>
              Usuń zaznaczone
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-border/70 bg-card/80 py-0">
        {data.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Brak projektów spełniających kryteria filtrowania.
          </div>
        ) : (
          <Accordion type="single" collapsible>
            {data.map((project, index) => {
              const clientName = project.client_id ? clientsById.get(project.client_id)?.name : undefined
              const isSelected = selectedIds.includes(project.id)
              const isLast = index === data.length - 1

              return (
                <AccordionItem
                  key={project.id}
                  value={project.id}
                  className={isLast ? 'border-b-0 px-4' : 'border-b border-border/60 px-4'}
                >
                  <div className="flex items-center gap-1 py-2">
                    <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleSelection(project.id, checked === true)}
                        aria-label={`Zaznacz projekt ${project.name}`}
                        className="size-5"
                      />
                    </label>

                    <div className="min-w-0 flex-1">
                      <AccordionTrigger className="w-full py-0 hover:no-underline">
                        <div className="w-full min-w-0 space-y-2 pr-1">
                          <p className="truncate text-left text-[15px] font-semibold leading-tight">
                            {project.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-left">
                            <Badge variant="outline" className={PROJECT_STATUS_BADGE_CLASS[project.status]}>
                              {PROJECT_STATUS_LABELS[project.status]}
                            </Badge>
                            <span className="truncate text-xs text-muted-foreground">
                              {project.end_date ? formatDate(project.end_date) : 'Brak terminu'}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                    </div>
                  </div>

                  <AccordionContent className="pb-4">
                    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <DetailRow
                        label="Klient"
                        value={(
                          <div className="inline-flex min-w-0 items-center gap-2">
                            <Avatar className="size-6 border border-zinc-200/80 dark:border-zinc-700/80">
                              <AvatarFallback className="text-[10px] font-semibold">
                                {getInitials(clientName ?? 'Brak klienta')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{clientName ?? 'Brak klienta'}</span>
                          </div>
                        )}
                      />
                      <DetailRow
                        label="Priorytet"
                        value={(
                          <span className="inline-flex items-center gap-2">
                            <Flag className="size-4" />
                            <Badge variant="outline" className={PROJECT_PRIORITY_BADGE_CLASS[project.priority]}>
                              {PRIORITY_LABELS[project.priority]}
                            </Badge>
                          </span>
                        )}
                      />
                      <DetailRow
                        label="Budżet"
                        value={project.budget_amount ? formatCurrency(project.budget_amount, 'PLN') : '—'}
                      />
                      <DetailRow label="Opis usługi" value={project.description ?? 'Brak opisu'} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="lg" onClick={() => onEditProject(project)}>
                        Edytuj
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        className="text-destructive"
                        onClick={() => onDeleteProject(project)}
                      >
                        Usuń
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </Card>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
