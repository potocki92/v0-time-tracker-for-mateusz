'use client'

import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '../../config/nav.config'
import { NavItem } from './NavItem'

export function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1">
      {NAV_ITEMS.slice(0, 5).map(item => (
        <NavItem
          key={item.href}
          item={item}
          isActive={pathname === item.href}
        />
      ))}
    </nav>
  )
}