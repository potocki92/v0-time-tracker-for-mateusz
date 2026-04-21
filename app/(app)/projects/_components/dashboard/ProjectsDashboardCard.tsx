import type { Project } from './types'
import { formatUpdatedAt, normalizeProgress, statusStyles, statusLabels } from './projects-dashboard.utils'

interface ProjectsDashboardCardProps {
  project: Project
  onSelect?: (project: Project) => void
}

export function ProjectsDashboardCard({ project, onSelect }: ProjectsDashboardCardProps) {
  const safeProgress = normalizeProgress(project.progress)
  const title = project?.title?.trim() || 'Projekt bez nazwy'
  const description = project?.description?.trim() || 'Brak opisu.'
  const formattedDate = formatUpdatedAt(project.updatedAt)

  const handleSelect = () => onSelect?.(project)

  return (
    <article
      className="group h-full rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-ring"
      aria-label={`Projekt: ${title}`}
    >
      <button
        type="button"
        onClick={handleSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleSelect()
          }
        }}
        className="w-full space-y-4 text-left focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[project.status]}`}
          >
            {statusLabels[project.status]}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Postęp</span>
            <span>{safeProgress}%</span>
          </div>
          <div
            className="h-2 rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={safeProgress}
            aria-label={`Postęp projektu: ${title}`}
          >
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Zaktualizowano: {formattedDate}</p>
      </button>
    </article>
  )
}
