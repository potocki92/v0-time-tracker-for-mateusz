'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)

      if (!data.user) {
        router.replace('/auth/login')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (!currentUser) {
          router.replace('/auth/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return { user, loading, logout }
}