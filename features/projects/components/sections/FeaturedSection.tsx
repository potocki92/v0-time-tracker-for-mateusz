'use client'

import { useProjectsData } from '../../hooks/useProjectsData'
import { useFeaturedProject } from '../../hooks/useFeaturedProject'
import { FeaturedProjectCard } from '../linear/FeaturedProjectCard'

export function FeaturedSection() {
  const { data } = useProjectsData()
  const featured = useFeaturedProject(data)

  if (!featured) return null

  return <FeaturedProjectCard featured={featured} />
}
