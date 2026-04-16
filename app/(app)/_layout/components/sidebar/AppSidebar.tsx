'use client'

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { SidebarNav } from './SidebarNav'
import { SidebarUserFooter } from './SidebarUserFooter'
import { AppSidebarHeader } from './SidebarHeader' // Używamy Twojej wersji z animacją
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { User } from '@supabase/supabase-js'

interface AppSidebarProps {
  user: User | null
  onLogout: () => void
  badges?: Partial<Record<string, number>>
}

function ThemeItem() {
  const { theme, setTheme } = useTheme()

  const icon =
    theme === 'dark' ? <Moon className="h-4 w-4" /> :
    theme === 'light' ? <Sun className="h-4 w-4" /> :
    <Monitor className="h-4 w-4" />

  const next =
    theme === 'dark' ? 'light' :
    theme === 'light' ? 'system' :
    'dark'

  const label =
    theme === 'dark' ? 'Tryb ciemny' :
    theme === 'light' ? 'Tryb jasny' :
    'Tryb systemowy'

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setTheme(next)}
        tooltip={label}
      >
        {icon}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ user, onLogout, badges, ...props }: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      {/* 1. Header z Logo i Toggle */}
      <AppSidebarHeader />

      {/* 2. Główna nawigacja (Przewijana) */}
      <SidebarContent>
        <SidebarNav badges={badges} />
      </SidebarContent>

      {/* 3. Stopka z motywem i profilem */}
      <SidebarFooter>
        <SidebarMenu>
          <ThemeItem />
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarUserFooter user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
