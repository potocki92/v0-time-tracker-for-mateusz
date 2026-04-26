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
 * Stopka użytkownika w stylu Claude:
 * - kompaktowy, płaski przycisk (brak ramki, brak gradientu),
 * - awatar 28×28, nazwa + email w drobnej hierarchii,
 * - hover: subtelne `bg-sidebar-accent` zamiast jaskrawego akcentu.
 *
 * Wrapper <SidebarFooter> jest w AppSidebar — ten plik dostarcza tylko zawartość.
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
              className="h-11 gap-2.5 rounded-md px-2 text-sidebar-foreground/85 hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent/70"
            >
              <Avatar
                avatarUrl={avatarUrl}
                displayName={displayName}
                initials={initials}
                className="size-7 shadow-none"
                fallbackClassName="text-[10.5px] font-semibold"
              />

              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[12.5px] font-medium text-sidebar-foreground">
                  {displayName}
                </span>
                <span className="truncate text-[10.5px] text-sidebar-foreground/55">
                  {email}
                </span>
              </div>

              <ChevronsUpDown
                className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden"
                strokeWidth={1.75}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={8}
            className="w-60"
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
