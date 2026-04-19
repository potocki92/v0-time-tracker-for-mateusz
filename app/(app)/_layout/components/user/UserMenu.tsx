'use client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Avatar } from './Avatar'
import { UserMenuPanel } from './UserMenuPanel'
import { useUserIdentity } from './useUserIdentity'

interface Props {
  user: SupabaseUser | null
  onLogout: () => void
}

export function UserMenu({ user, onLogout }: Props) {
  const { displayName, email, avatarUrl, initials } = useUserIdentity(user)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-auto rounded-full p-0 hover:bg-transparent focus-visible:ring-0"
          aria-label={displayName}
        >
          <Avatar
            avatarUrl={avatarUrl}
            displayName={displayName}
            initials={initials}
            className=""
            fallbackClassName="bg-muted/80 text-xs font-semibold"
            showIconFallback
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <UserMenuPanel
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
          initials={initials}
          onLogout={onLogout}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
