'use client'

import { useMemo } from 'react'
import type { Project } from '@/lib/types'
import { selectProjectStats } from '../_domain/projects.selectors'
import type { ProjectStats } from '../_domain/projects.types'

export function useProjectStats(projects: Project[]): ProjectStats {
  return useMemo(() => selectProjectStats(projects), [projects])
}
