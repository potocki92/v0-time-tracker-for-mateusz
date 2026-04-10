import { Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/helpers'
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Project } from '@/lib/types'

const statusBadgeClass: Record<Project['status'], string> = {
  planned: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  on_hold: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
}

type ProjectCardProps = {
  project: Project
  clientName: string
  progress: number
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, clientName, progress, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: project.color }} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-base">{project.name}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={statusBadgeClass[project.status]}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
              <Badge variant="secondary">Priorytet: {PRIORITY_LABELS[project.priority]}</Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(project)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}

        {project.target_quantity && project.target_quantity > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Postęp realizacji</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Klient
            </p>
            <p className="font-medium">{clientName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Budżet</p>
            <p className="font-medium">{project.budget_amount ? formatCurrency(project.budget_amount, 'PLN') : 'Brak'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
