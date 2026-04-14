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
  useSidebar,
} from '@/components/ui/sidebar'
import { SidebarNav }         from './SidebarNav'
import { SidebarUserFooter }  from './SidebarUserFooter'
import { useKeyboardSidebar } from '../../hooks/useKeyboardSidebar'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme }           from 'next-themes'
import Image                  from 'next/image'
import type { User }          from '@supabase/supabase-js'

interface AppSidebarProps {
  user:    User | null
  onLogout: () => void
  badges?:  Partial<Record<string, number>>
}

// ── Logo + trigger ────────────────────────────────────────────────────────────

function LogoTrigger() {
  const { toggleSidebar } = useSidebar()

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={toggleSidebar}
            tooltip="Toggle menu (⌘B)"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Image
                src="/logo.png"
                alt="TimeTracker"
                width={20}
                height={20}
                priority
                className="object-contain brightness-0 invert"
              />
            </div>
            <span className="truncate font-semibold">TimeTracker</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

// ── ThemeToggle jako SidebarMenuButton ────────────────────────────────────────
// Renderujemy bezpośrednio jako SidebarMenuButton zamiast osobnego DropdownMenu
// — prostsze, działa poprawnie z collapsible="icon"

function ThemeItem() {
  const { theme, setTheme } = useTheme()

  const icon =
    theme === 'dark'  ? <Moon className="h-4 w-4" />    :
    theme === 'light' ? <Sun  className="h-4 w-4" />    :
                        <Monitor className="h-4 w-4" />

  const next =
    theme === 'dark'  ? 'light'  :
    theme === 'light' ? 'system' :
                        'dark'

  const label =
    theme === 'dark'  ? 'Tryb ciemny'   :
    theme === 'light' ? 'Tryb jasny'    :
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

// ── AppSidebar ────────────────────────────────────────────────────────────────

export function AppSidebar({ user, onLogout, badges }: AppSidebarProps) {
  useKeyboardSidebar()

  return (
    <Sidebar collapsible="icon">
      <LogoTrigger />

      <SidebarContent>
        <SidebarNav badges={badges} />
      </SidebarContent>

      {/*
       * SidebarFooter — jeden, tutaj.
       * SidebarUserFooter NIE ma własnego SidebarFooter wrapera.
       */}
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