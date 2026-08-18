'use client'

import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useMemo } from 'react'
import { useProfile } from '@/features/settings'
import { toPublicAvatarUrl } from '@/lib/supabase/avatars'

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
    const metadata = (user?.user_metadata ?? {}) as {
      full_name?: string
      first_name?: string
      last_name?: string
      username?: string
      avatar_path?: string
    }

    const firstName = profile?.firstName ?? ''
    const lastName = profile?.lastName ?? ''
    const profileFullName = `${firstName} ${lastName}`.trim()
    const metadataFullName = `${metadata.first_name ?? ''} ${metadata.last_name ?? ''}`.trim()

    const fallbackDisplayName =
      metadata.full_name?.trim() ||
      metadataFullName ||
      metadata.username?.trim() ||
      (user?.email?.split('@')[0] ?? '')

    const displayName = profileFullName || profile?.username || fallbackDisplayName || 'Użytkownik'
    const email = profile?.email ?? user?.email ?? ''
    const optimisticAvatarUrl = toPublicAvatarUrl(metadata.avatar_path)
    const avatarUrl = profile?.avatarUrl ?? optimisticAvatarUrl ?? undefined

    return {
      displayName,
      email,
      avatarUrl,
      initials: getInitials(profileFullName || profile?.username || fallbackDisplayName, email),
    }
  }, [profile, user])
}
