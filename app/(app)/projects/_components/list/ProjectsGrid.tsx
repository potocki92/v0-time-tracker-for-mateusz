'use client'

import type { Client, Project, WorkEntry } from '@/lib/types'
import {
  selectClientName,
  selectProjectProgress,
} from '../../_domain/projects.selectors'
import { ProjectCard } from '../card/ProjectCard'

type Props = {
  projects: Project[]
  clients: Client[]
  workEntries: WorkEntry[]
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectsGrid({ projects, clients, workEntries, onEdit, onDelete }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          clientName={selectClientName(project.client_id, clients)}
          progress={selectProjectProgress(project, workEntries)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
