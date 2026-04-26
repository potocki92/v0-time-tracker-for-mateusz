'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import { NAV_SECTIONS, PINNED_ITEMS } from '../../config/nav.config'
import { NavItem, NavSection, PinnedItem } from '../../types/nav.types'

interface SidebarNavProps {
  badges?: Partial<Record<string, number>>
  onSearchClick?: () => void
}

/**
 * Główna nawigacja w stylu Claude:
 * - przycisk wyszukiwania z ⌘K na samej górze,
 * - sekcje "Workspace", "Insights" z subtelnymi etykietami,
 * - sekcja "Pinned" z kolorowymi kropkami zamiast ikon.
 *
 * Aktywny element: bardzo subtelne tło `bg-sidebar-accent`, brak glow / paska bocznego.
 */
export function SidebarNav({ badges = {}, onSearchClick }: SidebarNavProps) {
  return (
    <>
      <SearchGroup onSearchClick={onSearchClick} />

      {NAV_SECTIONS.map((section) => (
        <NavSectionGroup key={section.id} section={section} badges={badges} />
      ))}

      <PinnedGroup />
    </>
  )
}

/* ───────────────────────────── search ───────────────────────────── */

function SearchGroup({ onSearchClick }: { onSearchClick?: () => void }) {
  return (
    <SidebarGroup className="pt-1 pb-2">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Szukaj (⌘K)"
              onClick={onSearchClick}
              className={cn(
                'h-8 gap-2 rounded-md border border-sidebar-border/80 bg-transparent',
                'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                '[&>svg]:size-3.5',
              )}
            >
              <Search />
              <span className="flex-1 truncate text-left text-[12.5px]">Szukaj…</span>
              <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
                <Kbd className="h-4 min-w-[18px] rounded border border-sidebar-border/80 bg-transparent px-1 text-[10.5px]">
                  ⌘K
                </Kbd>
              </KbdGroup>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

/* ───────────────────────────── nav section ─────────────────────── */

function NavSectionGroup({
  section,
  badges,
}: {
  section: NavSection
  badges: Partial<Record<string, number>>
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel className="px-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/45">
        {section.label}
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-px">
          {section.items.map((item) => {
            const isActive = pathname === item.href
            const badge = badges[item.href] ?? item.count
            return (
              <NavRow
                key={item.href}
                item={item}
                active={isActive}
                count={badge}
              />
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function NavRow({
  item,
  active,
  count,
}: {
  item: NavItem
  active: boolean
  count?: number
}) {
  const Icon = item.icon
  const showCount = count != null && count > 0

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className={cn(
          'h-8 gap-2.5 rounded-md text-[13px] font-normal',
          'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
          'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium',
          '[&>svg]:size-[15px] [&>svg]:text-sidebar-foreground/55',
          'data-[active=true]:[&>svg]:text-sidebar-foreground',
        )}
      >
        <Link href={item.href}>
          <Icon strokeWidth={1.6} />
          <span className="flex-1 truncate">{item.label}</span>

          <span className="ml-auto flex items-center gap-1.5 group-data-[collapsible=icon]:hidden">
            {showCount && (
              <span className="text-[11px] tabular-nums text-sidebar-foreground/45">
                {count > 99 ? '99+' : count}
              </span>
            )}
            {item.shortcut && (
              <Kbd className="h-4 min-w-[18px] rounded border border-sidebar-border/80 bg-transparent px-1 text-[10.5px] font-medium text-sidebar-foreground/55">
                {item.shortcut}
              </Kbd>
            )}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/* ───────────────────────────── pinned ──────────────────────────── */

function PinnedGroup() {
  if (PINNED_ITEMS.length === 0) return null

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel className="px-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/45">
        Pinned
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-px">
          {PINNED_ITEMS.map((item) => (
            <PinnedRow key={`${item.href}-${item.label}`} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function PinnedRow({ item }: { item: PinnedItem }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.label}
        className={cn(
          'h-8 gap-2.5 rounded-md text-[13px] font-normal',
          'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        )}
      >
        <Link href={item.href}>
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: item.color }}
          />
          <span className="flex-1 truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
