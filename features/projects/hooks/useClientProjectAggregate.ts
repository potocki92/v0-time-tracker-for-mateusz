'use client'

import { useMemo } from 'react'
import {
  selectClientProjectAggregate,
  selectClientProjectAggregates,
} from '../types/projects.selectors'
import type { ClientProjectAggregate, ProjectsData } from '../types/projects.types'

/**
 * Public integration point for the clients module.
 * Returns aggregated KPIs (total budget, profitability, progress)
 * grouped per client_id — derived purely from ProjectsData, so the
 * clients module wires its own fetcher and reuses the math here.
 */
export function useClientProjectAggregates(data: ProjectsData): ClientProjectAggregate[] {
  return useMemo(() => selectClientProjectAggregates(data), [data])
}

export function useClientProjectAggregate(
  data: ProjectsData,
  clientId: string,
): ClientProjectAggregate | null {
  return useMemo(() => selectClientProjectAggregate(data, clientId), [data, clientId])
}
