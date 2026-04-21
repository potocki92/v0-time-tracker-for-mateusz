import type { Project } from './types'
import { ProjectsDashboardCard } from './ProjectsDashboardCard'

interface ProjectsDashboardListProps {
  projects: Project[]
  onProjectSelect?: (project: Project) => void
}

export function ProjectsDashboardList({ projects, onProjectSelect }: ProjectsDashboardListProps) {
  return (
    <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3" role="list">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectsDashboardCard project={project} onSelect={onProjectSelect} />
        </li>
      ))}
    </ul>
  )
}
