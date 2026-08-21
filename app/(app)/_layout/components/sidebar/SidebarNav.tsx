'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
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
import { usePrefetchRoute } from '@/hooks/prefetch'
import { NAV_SECTIONS, PINNED_ITEMS } from '../../config/nav.config'
import { NavBadge, NavItem, NavSection, PinnedItem } from '../../types/nav.types'

interface SidebarNavProps {
  badges?: Partial<Record<string, number>>
  onSearchClick?: () => void
}

/**
 * Główna nawigacja w stylu Claude / Linear:
 *  • search bar z ⌘K na samej górze
 *  • sekcje "Workspace", "Insights", "Automation" z subtelnymi etykietami
 *  • inline Quick Actions ("+") na hover obok Projektów / Klientów
 *  • badge'e kontekstowe (nieopłacone faktury, "Beta", "Nowość")
 *  • sekcja "Pinned" z kolorowymi kropkami zamiast ikon
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
              <span className="flex-1 truncate text-left text-xs">Szukaj…</span>
              <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
                <Kbd className="h-4 min-w-[18px] rounded border border-sidebar-border/80 bg-transparent px-1 text-2xs">
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
      <SidebarGroupLabel className="px-3 text-2xs font-medium uppercase tracking-[0.08em] text-sidebar-foreground/75">
        {section.label}
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-px">
          {section.items.map((item) => {
            const isActive = pathname === item.href
            const count = badges[item.href] ?? item.count
            return (
              <NavRow
                key={item.href}
                item={item}
                active={isActive}
                count={count}
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
  // Hook per wiersz zamiast jednego w SidebarNav: 11 instancji to 11 odczytow
  // contextu (tanie), a alternatywa to przewlekanie handlerow przez
  // NavSectionGroup do NavRow. Kazdy wiersz ma tez wlasny timer, wiec
  // opuszczenie jednego linku nie kasuje zamiaru na drugim.
  const { onHoverIntent, onFocusIntent, cancelIntent } = usePrefetchRoute()
  const showCount = count != null && count > 0
  const showBadgeLabel = Boolean(item.badge?.label)
  const hasQuickAction = Boolean(item.quickAction)

  return (
    <SidebarMenuItem className="group/nav-item relative">
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className={cn(
          'h-8 gap-2.5 rounded-md text-xs font-normal',
          'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
          'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium',
          '[&>svg]:size-[15px] [&>svg]:text-sidebar-foreground/55',
          'data-[active=true]:[&>svg]:text-sidebar-foreground',
          // Zostawiamy padding po prawej, gdy mamy quick action — żeby tekst się
          // nie podsuwał pod "+" pojawiający się na hover.
          hasQuickAction && 'pr-9',
        )}
      >
        <Link
          href={item.href}
          onMouseEnter={onHoverIntent(item.href)}
          onMouseLeave={cancelIntent}
          onFocus={onFocusIntent(item.href)}
          onBlur={cancelIntent}
        >
          <Icon strokeWidth={1.6} />
          <span className="flex-1 truncate">{item.label}</span>

          <span className="ml-auto flex items-center gap-1.5 group-data-[collapsible=icon]:hidden">
            {showBadgeLabel && (
              <BadgePill badge={item.badge!} />
            )}

            {showCount && <CountBadge count={count!} />}

            {item.shortcut && !hasQuickAction && (
              <Kbd className="h-4 min-w-[18px] rounded border border-sidebar-border/80 bg-transparent px-1 text-2xs font-medium text-sidebar-foreground/55">
                {item.shortcut}
              </Kbd>
            )}
          </span>
        </Link>
      </SidebarMenuButton>

      {hasQuickAction && (
        <QuickActionButton item={item} />
      )}
    </SidebarMenuItem>
  )
}

/* ─────────────────────────── badges ─────────────────────────── */

/**
 * CountBadge / BadgePill mają jeden, spójny styl: subtelny pill na tle
 * `sidebar-accent`, identyczny dla nieopłaconych faktur, dla "Beta",
 * dla "Slack · Trello" i dla "Nowość". Wariant koloru został świadomie
 * usunięty — sidebar nie powinien krzyczeć neonem o liczbach.
 */
const BADGE_BASE =
  'inline-flex h-[18px] items-center justify-center rounded-md bg-sidebar-accent/60 px-1.5 text-2xs font-semibold tabular-nums tracking-wide text-sidebar-foreground/65 ring-1 ring-sidebar-border/70'

function CountBadge({ count }: { count: number }) {
  const display = count > 99 ? '99+' : String(count)
  return (
    <span aria-label={`${count}`} className={cn(BADGE_BASE, 'min-w-[20px]')}>
      {display}
    </span>
  )
}

function BadgePill({ badge }: { badge: NavBadge }) {
  return (
    <span className={cn(BADGE_BASE, 'uppercase')}>
      {badge.label}
    </span>
  )
}

/* ─────────────────── inline quick action ("+") ─────────────────── */

function QuickActionButton({ item }: { item: NavItem }) {
  if (!item.quickAction) return null
  const { href, label } = item.quickAction
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        'absolute right-1.5 top-1/2 z-10 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md',
        'border border-sidebar-border/80 bg-sidebar text-sidebar-foreground/55',
        'opacity-0 transition-all duration-150',
        'hover:bg-primary/10 hover:text-primary hover:border-primary/40',
        'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'group-hover/nav-item:opacity-100 group-focus-within/nav-item:opacity-100',
        'group-data-[collapsible=icon]:hidden',
      )}
    >
      <Plus className="size-3" aria-hidden />
    </Link>
  )
}

/* ───────────────────────────── pinned ──────────────────────────── */

function PinnedGroup() {
  if (PINNED_ITEMS.length === 0) return null

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel className="px-3 text-2xs font-medium uppercase tracking-[0.08em] text-sidebar-foreground/75">
        Przypięte
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
          'h-8 gap-2.5 rounded-md text-xs font-normal transition-colors',
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
