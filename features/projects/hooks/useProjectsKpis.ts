'use client'

import { useMemo } from 'react'
import type { Project } from '@/lib/types'
import { selectProjectKpis } from '../types/projects.selectors'
import type { ProjectKpis } from '../types/projects.types'

export function useProjectsKpis(projects: Project[]): ProjectKpis {
  return useMemo(() => selectProjectKpis(projects), [projects])
}
