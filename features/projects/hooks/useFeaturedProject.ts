'use client'

import { useMemo } from 'react'
import { selectFeaturedProject } from '../types/projects.selectors'
import type { FeaturedProject, ProjectsData } from '../types/projects.types'

export function useFeaturedProject(data: ProjectsData): FeaturedProject | null {
  return useMemo(() => selectFeaturedProject(data), [data])
}
