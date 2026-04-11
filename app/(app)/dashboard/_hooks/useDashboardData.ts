'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchCurrentEurRate } from '@/lib/nbp'
import { DEFAULT_EUR_TO_PLN } from '../_domain/dashboard.constants'
import { DashboardData, UseDashboardDataReturn } from '../_domain/dashboard.types'


export function useDashboardData(): UseDashboardDataReturn {
  const [loading, setLoading] = useState(true)

  const [data, setData] = useState<DashboardData>({
    userName: 'Użytkowniku',
    eurToPlnRate: DEFAULT_EUR_TO_PLN,
    clients: [],
    workEntries: [],
    invoices: [],
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const metadata = user.user_metadata ?? {}

      const name =
        metadata.full_name ||
        metadata.name ||
        user.email?.split('@')[0] ||
        'Użytkowniku'

      const eurRateFromUser = Number(metadata.eur_to_pln)

      const [eurRateLive, clients, entries, invoices] = await Promise.all([
        fetchCurrentEurRate(),
        supabase.from('clients').select('*').eq('user_id', user.id),
        supabase.from('work_entries').select('*').eq('user_id', user.id),
        supabase.from('invoices').select('*').eq('user_id', user.id),
      ])

      setData({
        userName: name,
        eurToPlnRate:
          eurRateFromUser > 0
            ? eurRateFromUser
            : eurRateLive ?? DEFAULT_EUR_TO_PLN,
        clients: clients.data ?? [],
        workEntries: entries.data ?? [],
        invoices: invoices.data ?? [],
      })

      setLoading(false)
    }

    load()
  }, [])

  return { loading, data }
}