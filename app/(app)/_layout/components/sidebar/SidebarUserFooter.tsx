'use client'

/**
 * SidebarUserFooter.tsx
 *
 * Avatar usera w stopce sidebara z dropdownem.
 * Dokładnie wzorzec z docs shadcn/sidebar + Avatar komponent.
 */

import {
  SidebarFooter,
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
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'
import { ChevronsUpDown, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ── Helper: inicjały z imienia ────────────────────────────────────────────────

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email?.[0]?.toUpperCase() ?? 'U'
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarUserFooterProps {
  user:     SupabaseUser | null
  onLogout: () => void
}

// ── Komponent ─────────────────────────────────────────────────────────────────

export function SidebarUserFooter({ user, onLogout }: SidebarUserFooterProps) {
  const { isMobile } = useSidebar()

  const displayName = user?.user_metadata?.full_name as string | undefined
  const email       = user?.email
  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined
  const initials    = getInitials(displayName, email)

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 rounded-lg">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName ?? 'Użytkownik'} />}
                  <AvatarFallback className="rounded-lg text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Imię + e-mail — ukryte gdy sidebar zwinięty */}
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">
                    {displayName ?? 'Użytkownik'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                </div>

                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
              className="w-56"
            >
              {/* Header dropdownu — avatar + info (jak w docs shadcn) */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName ?? ''} />}
                    <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName ?? 'Użytkownik'}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Ustawienia
                </Link>
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
    </SidebarFooter>
  )
}