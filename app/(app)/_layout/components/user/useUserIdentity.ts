'use client'

import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useMemo } from 'react'
import { useProfile } from '@/app/(app)/settings/_hooks'

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    if (parts[0]) {
      return parts[0].slice(0, 2).toUpperCase()
    }
  }

  return email?.[0]?.toUpperCase() ?? 'U'
}

interface UserIdentity {
  displayName: string
  email: string
  avatarUrl?: string
  initials: string
}

export function useUserIdentity(user: SupabaseUser | null): UserIdentity {
  const { data: profile } = useProfile()

  return useMemo(() => {
    const firstName = profile?.firstName ?? ''
    const lastName = profile?.lastName ?? ''
    const fullName = `${firstName} ${lastName}`.trim()

    const fallbackDisplayName =
      (user?.user_metadata?.full_name as string | undefined)?.trim() ||
      (user?.email?.split('@')[0] ?? '')

    const displayName = fullName || profile?.username || fallbackDisplayName || 'Użytkownik'
    const email = profile?.email ?? user?.email ?? ''
    const avatarUrl = profile?.avatarUrl ?? undefined

    return {
      displayName,
      email,
      avatarUrl,
      initials: getInitials(fullName || profile?.username || fallbackDisplayName, email),
    }
  }, [profile, user])
}
