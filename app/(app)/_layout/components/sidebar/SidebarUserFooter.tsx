'use client'

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDown } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Avatar } from '../user/Avatar'
import { UserMenuPanel } from '../user/UserMenuPanel'
import { useUserIdentity } from '../user/useUserIdentity'

interface SidebarUserFooterProps {
  user: SupabaseUser | null
  onLogout: () => void
}

/**
 * WAŻNE: komponent NIE zawiera <SidebarFooter> — ten wrapper jest w AppSidebar.
 */
export function SidebarUserFooter({ user, onLogout }: SidebarUserFooterProps) {
  const { isMobile } = useSidebar()
  const { displayName, email, avatarUrl, initials } = useUserIdentity(user)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={displayName}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar
                avatarUrl={avatarUrl}
                displayName={displayName}
                initials={initials}
                className="size-8"
                fallbackClassName="text-xs"
              />

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>

              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
            className="w-56"
          >
            <UserMenuPanel
              displayName={displayName}
              email={email}
              avatarUrl={avatarUrl}
              initials={initials}
              onLogout={onLogout}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
