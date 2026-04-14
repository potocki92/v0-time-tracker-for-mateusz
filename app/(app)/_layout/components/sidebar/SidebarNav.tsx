'use client'

/**
 * SidebarNav.tsx
 *
 * Sekcje nawigacyjne z ikonami i etykietami.
 * Etykiety znikają gdy sidebar jest zwinięty (collapsible="icon").
 *
 * Pomysł #5: badge z liczbą niezapłaconych faktur na pozycji "Faktury".
 */

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from '@/components/ui/sidebar'
import { NavItem } from '@/app/(app)/dashboard/_components/navigation/BottomNav.types'
import { NAV_ITEMS } from '@/app/(app)/dashboard/_components/navigation/BottomNav.constants'

// ── Typy ──────────────────────────────────────────────────────────────────────

interface NavSection {
  label:     string
  items:     NavItem[]
}

interface SidebarNavProps {
  /** Mapa href → liczba badge (np. niezapłacone faktury) */
  badges?: Partial<Record<string, number>>
}

// ── Grupowanie nav items ──────────────────────────────────────────────────────

function buildSections(items: readonly NavItem[]): NavSection[] {
  // Zakładamy że NAV_ITEMS ma opcjonalne pole `group?: string`
  // Jeśli nie — wszystkie trafiają do jednej sekcji "Nawigacja"
  const groupMap = new Map<string, NavItem[]>()

  for (const item of items) {
    const group = (item as NavItem & { group?: string }).group ?? 'Nawigacja'
    if (!groupMap.has(group)) groupMap.set(group, [])
    groupMap.get(group)!.push(item)
  }

  return Array.from(groupMap.entries()).map(([label, items]) => ({ label, items }))
}

// ── NavRow ────────────────────────────────────────────────────────────────────

interface NavRowProps {
  item:     NavItem
  isActive: boolean
  badge?:   number
}

function NavRow({ item, isActive, badge }: NavRowProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}   // tooltip widoczny gdy sidebar zwinięty
      >
        <Link href={item.href} className="flex items-center gap-2">
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>

      {/* Badge — pokazywany zarówno w trybie icon jak i expanded */}
      {badge != null && badge > 0 && (
        <SidebarMenuBadge>{badge > 99 ? '99+' : badge}</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}

// ── SidebarNav ────────────────────────────────────────────────────────────────

export function SidebarNav({ badges = {} }: SidebarNavProps) {
  const pathname  = usePathname()
  const sections  = buildSections(NAV_ITEMS)

  return (
    <SidebarContent>
      {sections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <NavRow
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  badge={badges[item.href]}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  )
}