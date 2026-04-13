'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { NAV_ITEMS } from '../../config/nav.config'

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around py-2">
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}