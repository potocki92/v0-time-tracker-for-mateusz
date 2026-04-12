'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getDashboardData } from '../_services/dashboard.service'
import { DashboardData } from '../_domain/dashboard.types'

export function useDashboardData() {
  return useSuspenseQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}