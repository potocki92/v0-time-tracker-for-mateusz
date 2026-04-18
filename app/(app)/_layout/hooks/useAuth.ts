'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'
import { performLogout } from '@/lib/auth/logout'

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router                = useRouter()
  const queryClient           = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setUser(data.user)
      setLoading(false)
      if (!data.user) router.replace('/auth/login')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === 'SIGNED_OUT' || !currentUser) {
        // performLogout robi twardy redirect; tutaj fallback dla zewnętrznego sign-out.
        router.replace('/auth/login')
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [router])

  const logout = useCallback(async () => {
    await performLogout(queryClient)
  }, [queryClient])

  return { user, loading, logout }
}
