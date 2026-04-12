'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS }            from './BottomNav.constants'
import { cn }                   from '@/lib/utils'
import { usePrefetchDashboard } from '@/hooks/prefetch'

/**
 * Dolna nawigacja mobilna.
 * Linki z `prefetch: true` prefetchują dane na hover/focus.
 */
export function BottomNav() {
  const pathname            = usePathname()
  const { prefetchOnHover } = usePrefetchDashboard()

  return (
    <nav
      aria-label="Nawigacja główna"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <ul className="flex h-16 items-center" role="list">
        {NAV_ITEMS.map(({ href, label, icon: Icon, prefetch }) => {
          const isActive = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={prefetch ? prefetchOnHover : undefined}
                onFocus={prefetch ? prefetchOnHover : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}