'use client'

import * as React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { SidebarNav } from './SidebarNav'
import { SidebarUserFooter } from './SidebarUserFooter'
import { AppSidebarHeader } from './SidebarHeader'
import { SidebarTracker } from './SidebarTracker'
import type { User } from '@supabase/supabase-js'

interface AppSidebarProps {
  user: User | null
  onLogout: () => void
  badges?: Partial<Record<string, number>>
}

/**
 * Sidebar w stylu Claude / Linear:
 *  ┌──────────────────────────────┐
 *  │ Logo + Workspace · Developer │  ← Header
 *  │ ⌕ Szukaj…              ⌘K    │  ← Search
 *  │ WORKSPACE                    │
 *  │   Dashboard               D  │
 *  │   Kalendarz               C  │
 *  │   Projekty                P  │
 *  │   Klienci                    │
 *  │   Faktury                 I  │
 *  │ INSIGHTS                     │
 *  │   Raporty / Cele / Zarobki   │
 *  │ PINNED                       │
 *  │   • Hans-Böckler-Str. 284    │
 *  │   • Im Winkel 51             │
 *  │   • Gustavsburger 25–35      │
 *  │ ──────────────────────────── │
 *  │ Tracking · Im Winkel 51      │  ← Footer (tracker + profile)
 *  │ 02:14:08              [Stop] │
 *  │ MP  Mateusz Potocki     ⌃⌄  │
 *  └──────────────────────────────┘
 */
export function AppSidebar({
  user,
  onLogout,
  badges,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <AppSidebarHeader />

      <SidebarContent className="gap-0">
        <SidebarNav badges={badges} />
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border/60 px-2 pt-2 pb-2">
        <SidebarTracker />
        <SidebarUserFooter user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
