'use client'

import { useTranslations } from 'next-intl'
import { BOTTOM_NAV_ITEMS } from './BottomNav.constants'
import { cn } from '@/lib/utils'
import { Link, usePathname } from '@/i18n/navigation'
import { usePrefetchRoute } from '@/hooks/prefetch'

/**
 * Globalny dolny pasek nawigacyjny — widoczny wyłącznie na urządzeniach
 * mobilnych (`md:hidden`).
 *
 * Aktywny element rozróżniamy WYŁĄCZNIE kolorem ikony i etykiety
 * (`text-brand-400`). Bez tła, bez pillów, bez wskaźników nad
 * zakładką — celowo minimalistycznie, zgodnie z linearowym stylem
 * dashboardu.
 *
 * Wysokość paska jest spięta z nagłówkiem obszaru roboczego przez wspólny token
 * `--app-bar-height` w `globals.css`.
 */
export function BottomNav() {
  const t = useTranslations('navigation')
  // Sciezka BEZ prefiksu jezyka — `/de/projects` i `/projects` daja to samo
  // dopasowanie aktywnej zakladki.
  const pathname = usePathname()
  const { onHoverIntent, onFocusIntent, cancelIntent } = usePrefetchRoute()

  return (
    <nav
      aria-label={t('mainNavigation')}
      className="fixed bottom-0 left-0 right-0 z-50 block border-t border-hairline bg-surface-0/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="flex h-[var(--app-bar-height)] items-stretch" role="list">
        {BOTTOM_NAV_ITEMS.map(({ href, segment, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={onHoverIntent(href)}
                onMouseLeave={cancelIntent}
                onFocus={onFocusIntent(href)}
                onBlur={cancelIntent}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 px-1 text-2xs font-medium leading-[1.1] transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                  isActive
                    ? 'text-brand-400'
                    : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="truncate">{t(`sections.${segment}`)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
