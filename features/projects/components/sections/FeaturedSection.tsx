'use client'

import type { Project } from '@/lib/types'
import { useFeaturedProject } from '../../hooks/useFeaturedProject'
import { useProjectsData } from '../../hooks/useProjectsData'
import { FeaturedProjectCard } from '../linear/FeaturedProjectCard'

type FeaturedSectionProps = {
  onEditProject?: (project: Project) => void
}

export function FeaturedSection({ onEditProject }: FeaturedSectionProps) {
  const { data } = useProjectsData()
  const featured = useFeaturedProject(data)

  if (!featured) return null

  return <FeaturedProjectCard featured={featured} onEdit={onEditProject} />
}
