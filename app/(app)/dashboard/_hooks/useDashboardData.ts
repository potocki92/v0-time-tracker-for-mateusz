'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardData } from '../_services/dashboard.service'
import { DashboardData } from '../_domain/dashboard.types'

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,

    // 🔥 kluczowe ustawienia
    staleTime: 1000 * 60 * 5, // 5 minut → brak refetch
    gcTime: 1000 * 60 * 30,   // cache trzymany 30 min

    retry: 1,

    refetchOnWindowFocus: false,
  })
}