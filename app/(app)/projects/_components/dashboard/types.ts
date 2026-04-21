export interface Project {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'archived'
  progress: number
  updatedAt: Date
}

export interface ProjectsDashboardProps {
  projects?: Project[]
  onProjectSelect?: (project: Project) => void
}
