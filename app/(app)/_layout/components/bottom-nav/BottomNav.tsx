'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BOTTOM_NAV_ITEMS } from './BottomNav.constants'
import { cn } from '@/lib/utils'
import { usePrefetchDashboard } from '@/hooks/prefetch'

/**
 * Globalny dolny pasek nawigacyjny — widoczny wyłącznie na urządzeniach
 * mobilnych (`block md:hidden`). Na desktopie nawigację zapewnia sidebar.
 */
export function BottomNav() {
  const pathname = usePathname()
  const { prefetchOnHover } = usePrefetchDashboard()

  return (
    <nav
      aria-label="Nawigacja główna"
      className="fixed bottom-0 left-0 right-0 z-50 block border-t border-[#1a1a1a] bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="flex h-16 items-stretch" role="list">
        {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon, prefetch }) => {
          const isActive = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={prefetch ? prefetchOnHover : undefined}
                onFocus={prefetch ? prefetchOnHover : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium leading-[1.2] transition-colors',
                  isActive
                    ? 'text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-200',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition',
                    isActive
                      ? 'bg-emerald-500/10 shadow-[0_0_14px_-4px_rgba(34,197,94,0.6)]'
                      : '',
                  )}
                >
                  <Icon
                    className={cn('h-5 w-5 transition-transform', isActive && 'scale-105')}
                    aria-hidden
                  />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
