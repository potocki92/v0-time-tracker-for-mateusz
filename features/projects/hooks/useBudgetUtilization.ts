'use client'

import { useMemo } from 'react'
import { selectBudgetUtilization } from '../types/projects.selectors'
import type { ProjectBudgetUtilization, ProjectsData } from '../types/projects.types'

export function useBudgetUtilization(data: ProjectsData): ProjectBudgetUtilization {
  return useMemo(() => selectBudgetUtilization(data), [data])
}
