'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from '@/components/ui/sidebar'
import { NAV_ITEMS } from '../../config/nav.config'
import { NavItem } from '../../types/nav.types'

interface SidebarNavProps {
  badges?: Partial<Record<string, number>>
}

export function SidebarNav({ badges = {} }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      {/* Etykieta grupy — znika gdy sidebar zwinięty */}
      <SidebarGroupLabel>Menu</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item: NavItem) => {
            const isActive = pathname === item.href
            const badge    = badges[item.href]

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  // tooltip = etykieta widoczna na hover gdy sidebar zwinięty
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {/* Span znika automatycznie gdy collapsible="icon" + sidebar zwinięty */}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>

                {badge != null && badge > 0 && (
                  <SidebarMenuBadge>{badge > 99 ? '99+' : badge}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}