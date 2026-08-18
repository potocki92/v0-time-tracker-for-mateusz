import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Briefcase } from 'lucide-react'
import type { Project } from '@/lib/types'

interface Props {
  projects: Project[]
  value: string
  onChange: (value: string) => void
}

export function ProjectSelect({ projects, value, onChange }: Props) {
  if (projects.length === 0) return null

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Projekt
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 sm:h-9">
          <SelectValue placeholder="Wybierz projekt (opcjonalnie)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">Brak projektu</span>
          </SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                {project.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
