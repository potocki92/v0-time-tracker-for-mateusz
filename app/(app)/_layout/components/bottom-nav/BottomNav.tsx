'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BOTTOM_NAV_ITEMS } from './BottomNav.constants'
import { cn } from '@/lib/utils'
import { usePrefetchDashboard } from '@/hooks/prefetch'

/**
 * Globalny dolny pasek nawigacyjny — widoczny wyłącznie na urządzeniach
 * mobilnych (`block md:hidden`). Na desktopie nawigację zapewnia sidebar.
 *
 * Wysokość paska jest zsynchronizowana z `MobileHeader` przez wspólny token
 * `--app-bar-height` w `globals.css`, dzięki czemu krawędzie aplikacji są
 * wizualnie symetryczne. Każdy item zachowuje pionowe wycentrowanie ikony
 * i etykiety niezależnie od rozdzielczości.
 */
export function BottomNav() {
  const pathname = usePathname()
  const { prefetchOnHover } = usePrefetchDashboard()

  return (
    <nav
      aria-label="Nawigacja główna"
      className="fixed bottom-0 left-0 right-0 z-50 block border-t border-border bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="flex h-[var(--app-bar-height)] items-stretch" role="list">
        {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon, prefetch }) => {
          const isActive = pathname === href
          return (
            <li key={href} className="relative flex-1">
              {isActive && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 h-[2px] w-8 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_2px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
                />
              )}
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={prefetch ? prefetchOnHover : undefined}
                onFocus={prefetch ? prefetchOnHover : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10.5px] font-medium leading-[1.1] transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition',
                    isActive
                      ? 'bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_14px_-4px_color-mix(in_oklch,var(--primary)_60%,transparent)]'
                      : '',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] transition-transform',
                      isActive && 'scale-105',
                    )}
                    aria-hidden
                  />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
