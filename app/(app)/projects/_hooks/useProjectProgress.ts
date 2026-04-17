'use client'

import { useMemo } from 'react'
import type { Project, WorkEntry } from '@/lib/types'
import { selectProgressByProject } from '../_domain/projects.selectors'
import type { ProjectProgress } from '../_domain/projects.types'

export function useProjectProgress(
  projects: Project[],
  workEntries: WorkEntry[],
): Map<string, ProjectProgress> {
  return useMemo(
    () => selectProgressByProject(projects, workEntries),
    [projects, workEntries],
  )
}
