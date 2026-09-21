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
 * Pasek odcina się od treści własną powierzchnią: zaokrąglona górna krawędź,
 * półprzezroczyste tło ze skali panelu i rozmycie tego, co pod nim przejeżdża.
 * Aktywny element niesie akcent motywu — kolor ikony i etykiety plus bardzo
 * delikatnie podbarwione gniazdo ikony. Bez dużej pigułki pod zakładką:
 * akcent ma prowadzić wzrok, a nie budować drugi pasek.
 *
 * Trasy i kolejność idą z `BOTTOM_NAV_ITEMS`, czyli z rejestru sekcji panelu —
 * nie ma tu drugiej, ręcznie pisanej listy adresów.
 *
 * Wysokość paska jest spięta z nagłówkiem obszaru roboczego przez wspólny token
 * `--app-bar-height` w `globals.css`; `env(safe-area-inset-bottom)` dokłada
 * pasek gestu na telefonach bez przycisku Home.
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
      className="fixed inset-x-0 bottom-0 z-50 block rounded-t-[20px] border-t border-hairline bg-surface-1/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
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
                  'flex h-full flex-col items-center justify-center gap-0.5 px-1 text-2xs font-medium leading-[1.1] transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40',
                  isActive ? 'text-brand-400' : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex h-6 w-10 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-brand-500/10',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="truncate">{t(`sections.${segment}`)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
