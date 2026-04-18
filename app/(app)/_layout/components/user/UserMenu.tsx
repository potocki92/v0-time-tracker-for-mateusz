'use client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, LogOut, Settings } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useOpenModal } from '@/hooks/stores/useUiStore'
import { useMemo } from 'react'

interface Props {
  user:     SupabaseUser | null
  onLogout: () => void
}

function getInitialsFromUser(user: SupabaseUser | null): string {
  const source =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    ''
  const parts = source.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function resolveAvatarUrl(user: SupabaseUser | null): string | null {
  const meta = user?.user_metadata ?? {}
  const candidate =
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    (meta.photo_url as string | undefined) ??
    null
  if (!candidate || typeof candidate !== 'string') return null
  return candidate.trim().length > 0 ? candidate : null
}

export function UserMenu({ user, onLogout }: Props) {
  const openModal = useOpenModal()

  const { avatarUrl, initials, displayName } = useMemo(() => {
    return {
      avatarUrl:   resolveAvatarUrl(user),
      initials:    getInitialsFromUser(user),
      displayName: (user?.user_metadata?.full_name as string | undefined) || 'User',
    }
  }, [user])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={displayName}
        >
          <Avatar className="size-7">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-muted text-xs font-semibold">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => openModal('settings')}>
          <Settings className="mr-2 w-4 h-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 w-4 h-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
