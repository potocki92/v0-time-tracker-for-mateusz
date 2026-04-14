'use client'

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
import { SidebarNav }         from './SidebarNav'
import { SidebarUserFooter }  from './SidebarUserFooter'
import { ThemeToggle }        from '../theme/ThemeToggle'
import { useSidebar }         from '@/components/ui/sidebar'
import { useKeyboardSidebar } from '../../hooks/useKeyboardSidebar'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'

interface AppSidebarProps {
  user:     User | null
  onLogout: () => void
  badges?:  Partial<Record<string, number>>
}

// ── Logo trigger ──────────────────────────────────────────────────────────────

function LogoTrigger() {
  const { toggleSidebar, open } = useSidebar()

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={toggleSidebar}
            tooltip={open ? 'Zwiń menu' : 'Rozwiń menu (⌘B)'}
            className="gap-3 data-[state=open]:bg-sidebar-accent"
          >
            {/* Ikona — zawsze widoczna */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Image
                src="/logo.png"
                alt="TimeTracker"
                width={20}
                height={20}
                priority
                className="object-contain"
              />
            </div>

            {/* Nazwa — tylko gdy rozwinięty (shadcn ukrywa automatycznie) */}
            <span className="truncate font-semibold">TimeTracker</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

// ── AppSidebar ────────────────────────────────────────────────────────────────

export function AppSidebar({ user, onLogout, badges }: AppSidebarProps) {
  useKeyboardSidebar()

  return (
    /*
     * collapsible="icon" → zwinięty pokazuje tylko ikony, rozwinięty ikony + napisy
     * variant="sidebar"  → zawsze widoczny (nie overlay), wypycha content
     */
    <Sidebar collapsible="icon" variant="sidebar">

      <LogoTrigger />

      <SidebarContent>
        <SidebarNav badges={badges} />
      </SidebarContent>

      <SidebarFooter>
        {/* ThemeToggle wycentrowany */}
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarUserFooter user={user} onLogout={onLogout} />
      </SidebarFooter>

    </Sidebar>
  )
}