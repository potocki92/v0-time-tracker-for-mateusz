'use client'

/**
 * SidebarHeader.tsx — Claude-style brand block.
 *
 * Korzysta z dedykowanego komponentu <Logo />; ramka i akcent tła
 * są zachowane (border + bg-sidebar-accent), żeby nie zmieniać wyglądu
 * po podmianie ikony.
 */

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/brand/logo'

export function AppSidebarHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <SidebarHeader className="px-2 pt-2 pb-1">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={toggleSidebar}
            tooltip="TimeTracker — Workspace"
            className="gap-2.5 hover:bg-sidebar-accent/60"
          >
            <BrandMark />

            <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-[13.5px] font-semibold tracking-tight">
                TimeTracker
              </span>
              <span className="truncate text-[10.5px] font-normal text-sidebar-foreground/55">
                Workspace · Developer
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

function BrandMark() {
  return (
    <div
      aria-hidden
      className="relative flex aspect-square size-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border/80 bg-sidebar-accent/40 p-1"
    >
      <Logo size="sm" className="size-5" />
    </div>
  )
}
