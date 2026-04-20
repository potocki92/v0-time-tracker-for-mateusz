'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Flag } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Client, type Project } from '@/lib/types'
import {
  PROJECT_PRIORITY_BADGE_CLASS,
  PROJECT_STATUS_BADGE_CLASS,
} from '../../_domain/projects.constants'

type ProjectsMobileAccordionProps = {
  data: Project[]
  clients: Client[]
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export function ProjectsMobileAccordion({
  data,
  clients,
  onEditProject,
  onDeleteProject,
}: ProjectsMobileAccordionProps) {
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelection = (projectId: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, projectId] : prev.filter((id) => id !== projectId)))
  }

  const removeSelected = () => {
    if (!selectedIds.length) return
    data
      .filter((project) => selectedIds.includes(project.id))
      .forEach((project) => onDeleteProject(project))
    setSelectedIds([])
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <Card className="border-destructive/30 bg-card/80 py-3">
          <CardContent className="flex items-center justify-between px-4">
            <p className="text-sm text-muted-foreground">
              Zaznaczono: <span className="font-semibold text-foreground">{selectedIds.length}</span>
            </p>
            <Button variant="destructive" size="sm" onClick={removeSelected}>
              Usuń zaznaczone
            </Button>
          </CardContent>
        </Card>
      )}

      {data.map((project) => {
        const clientName = project.client_id ? clientsById.get(project.client_id)?.name : undefined
        const isSelected = selectedIds.includes(project.id)

        return (
          <Card key={project.id} className="overflow-hidden bg-card/80 py-0">
            <Accordion type="single" collapsible>
              <AccordionItem value={project.id} className="border-b-0">
                <div className="flex items-start gap-3 px-4 pt-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => toggleSelection(project.id, checked === true)}
                    aria-label={`Zaznacz projekt ${project.name}`}
                    className="mt-1 h-5 w-5"
                  />

                  <div className="min-w-0 flex-1">
                    <AccordionTrigger className="w-full py-0 hover:no-underline">
                      <div className="w-full space-y-2 pr-2">
                        <p className="truncate text-left text-base font-semibold leading-tight">
                          {project.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-left">
                          <Badge variant="outline" className={PROJECT_STATUS_BADGE_CLASS[project.status]}>
                            {PROJECT_STATUS_LABELS[project.status]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {project.end_date ? formatDate(project.end_date) : 'Brak terminu'}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                  </div>
                </div>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <DetailRow label="Klient" value={clientName ?? 'Brak klienta'} />
                    <DetailRow
                      label="Priorytet"
                      value={(
                        <span className="inline-flex items-center gap-2">
                          <Flag className="h-4 w-4" />
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
            </Accordion>
          </Card>
        )
      })}
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
