'use client'

/**
 * SidebarHeader.tsx — Claude-style brand block.
 *
 * Wyrafinowane, minimalistyczne logo (mini bar-chart w neutralnych tonach
 * z jednym akcentowym paskiem) + nazwa workspace'u + podtytuł "Workspace · Developer".
 * Kliknięcie = toggle sidebar, tooltip działa w trybie zwiniętym.
 */

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'

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
      className="relative flex aspect-square size-7 shrink-0 items-end justify-center gap-[3px] rounded-md border border-sidebar-border/80 bg-sidebar-accent/40 p-1.5"
    >
      <span className="h-1.5 w-[3px] rounded-[1.5px] bg-sidebar-foreground/40" />
      <span className="h-2.5 w-[3px] rounded-[1.5px] bg-sidebar-foreground/70" />
      <span className="h-3.5 w-[3px] rounded-[1.5px] bg-sidebar-primary" />
    </div>
  )
}
