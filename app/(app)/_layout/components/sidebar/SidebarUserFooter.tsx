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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ChevronsUpDown, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useOpenModal } from '@/hooks/stores/useUiStore'
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

interface SidebarUserFooterProps {
  user:     SupabaseUser | null
  onLogout: () => void
}

/**
 * WAŻNE: komponent NIE zawiera <SidebarFooter> — ten wrapper jest w AppSidebar.
 */
export function SidebarUserFooter({ user, onLogout }: SidebarUserFooterProps) {
  const { isMobile } = useSidebar()
  const openModal = useOpenModal()

  // Profile przez React Query: sidebar i panel Ustawień dzielą to samo źródło prawdy,
  // więc po uploadzie avatara (invalidateQueries) sidebar odświeża się automatycznie.
  const { data: profile } = useProfile()

  const firstName   = profile?.firstName ?? ''
  const lastName    = profile?.lastName ?? ''
  const fullName    = `${firstName} ${lastName}`.trim()
  const displayName = fullName || profile?.username || 'Użytkownik'
  const email       = profile?.email ?? user?.email ?? ''
  const avatarUrl   = profile?.avatarUrl ?? undefined
  const initials    = getInitials(fullName || profile?.username, email)

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
              <Avatar className="h-8 w-8 rounded-lg">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                )}
                <AvatarFallback className="rounded-lg text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>

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
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Avatar className="h-8 w-8 rounded-lg">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => openModal('settings')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Ustawienia
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Wyloguj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
