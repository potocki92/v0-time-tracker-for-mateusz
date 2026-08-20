'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

const AUTH_USER_KEY = ['auth', 'user'] as const

export function useCurrentUser() {
  const qc = useQueryClient()

  // Subscribe na zmiany auth (login/logout/token refresh)
  useEffect(() => {
    const supabase = createClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        qc.setQueryData(AUTH_USER_KEY, null)
        qc.clear() // wyczyść CAŁY cache po logout
        return
      }
      if (session?.user) {
        qc.setQueryData(AUTH_USER_KEY, session.user)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [qc])

  return useQuery<User | null>({
    queryKey: AUTH_USER_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      return data.user
    },
    staleTime: Infinity, // niezależnie odświeżane przez onAuthStateChange
    gcTime: Infinity,
  })
}

