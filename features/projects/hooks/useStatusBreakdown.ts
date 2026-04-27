'use client'

import { useMemo } from 'react'
import type { Project } from '@/lib/types'
import { selectStatusBreakdown } from '../types/projects.selectors'
import type { ProjectStatusBreakdown } from '../types/projects.types'

export function useStatusBreakdown(projects: Project[]): ProjectStatusBreakdown {
  return useMemo(() => selectStatusBreakdown(projects), [projects])
}
