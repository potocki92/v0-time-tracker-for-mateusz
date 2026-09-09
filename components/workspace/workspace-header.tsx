'use client'

import { type ReactNode } from 'react'
import { Bell, ChevronRight, Play, Square } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useElapsedSeconds, useTimerStore } from '@/hooks/stores/useTimerStore'
import { usePathname } from '@/i18n/navigation'
import { resolveNestedLabel, resolveSection } from '@/lib/workspace/sections'
import { useHeaderSlotRef } from './workspace-header-slot'

interface WorkspaceHeaderProps {
  /** Chrome layoutu po lewej (na mobile: przelacznik sidebara). */
  leading?: ReactNode
  /** Chrome layoutu po prawej (na mobile: motyw + menu uzytkownika). */
  trailing?: ReactNode
}

/**
 * Jeden naglowek dla calego panelu — renderowany raz, w `AppShell`.
 *
 * Lewa strona: breadcrumb `{grupa} › {sekcja}` z rejestru sekcji, na trasie
 * zagniezdzonej z trzecim czlonem. Prawa: slot na akcje strony, powiadomienia
 * i licznik czasu.
 *
 * Stala wysokosc `h-14` jest celowa — naglowek nie zmienia wysokosci przy
 * nawigacji ani po starcie licznika, wiec nawigacja nie generuje CLS.
 */
export function WorkspaceHeader({ leading, trailing }: WorkspaceHeaderProps) {
  const t = useTranslations('navigation')
  // `usePathname` z warstwy i18n zwraca sciezke BEZ prefiksu jezyka, wiec
  // rejestr sekcji dopasowuje `/de/projects` tak samo jak `/projects`.
  const pathname = usePathname() ?? ''
  const section = resolveSection(pathname)
  const nested = section ? resolveNestedLabel(pathname) : undefined
  const slotRef = useHeaderSlotRef()

  return (
    <header
      aria-label={t('header.aria')}
      data-testid="workspace-header"
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-background/80 px-[var(--header-inline-padding)] backdrop-blur"
    >
      {leading}

      <nav
        aria-label={t('header.breadcrumb')}
        data-testid="workspace-breadcrumb"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-xs"
      >
        {section && (
          <>
            {/* Na telefonie zostaje sama etykieta sekcji — grupa i separator
                zabieraly polowe paska, nie wnoszac nic ponad to, co widac
                w sidebarze. */}
            <span className="hidden shrink-0 text-muted-foreground sm:inline">
              {t(`groups.${section.group}`)}
            </span>
            <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" aria-hidden />
            <BreadcrumbLeaf
              label={t(`sections.${section.segment}`)}
              current={!nested}
              truncate={!nested}
            />
            {nested && (
              <>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                {/* Nazwa encji (projekt, klient, numer faktury) to DANE
                    uzytkownika — wyswietlamy ja doslownie, bez tlumaczenia. */}
                <BreadcrumbLeaf
                  label={'key' in nested ? t(`nested.${nested.key}`) : nested.text}
                  current
                  truncate
                />
              </>
            )}
          </>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        {/* Wezel portalu dla `<WorkspaceHeaderActions>` — pusty, gdy strona
            nie ma akcji glownej. */}
        <div
          ref={slotRef}
          data-testid="workspace-header-actions"
          className="flex items-center gap-2"
        />

        <NotificationsButton />
        <TimerButton />
        {trailing}
      </div>
    </header>
  )
}

function BreadcrumbLeaf({
  label,
  current,
  truncate,
}: {
  label: string
  current: boolean
  truncate: boolean
}) {
  return (
    <span
      aria-current={current ? 'page' : undefined}
      className={cn(
        'font-medium text-foreground',
        truncate ? 'truncate' : 'shrink-0',
      )}
    >
      {label}
    </span>
  )
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background'

/**
 * Powiadomienia nie maja jeszcze zrodla danych — badge z liczba nieprzeczytanych
 * pojawi sie, gdy takie zrodlo powstanie. Do tego czasu sam dzwonek, tak jak
 * w pasku, ktory ten naglowek zastapil.
 */
function NotificationsButton() {
  const t = useTranslations('navigation')

  return (
    <button
      type="button"
      aria-label={t('header.notifications')}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md border border-hairline bg-surface-1',
        'text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground',
        FOCUS_RING,
      )}
    >
      <Bell className="size-4" aria-hidden />
    </button>
  )
}

const formatMmSs = (total: number) => {
  const seconds = Math.max(0, Math.floor(total))
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/** Ten sam licznik co widget w sidebarze — wspolny store, nie druga kopia stanu. */
function TimerButton() {
  const t = useTranslations('navigation')
  const running = useTimerStore((state) => state.running)
  const toggle = useTimerStore((state) => state.toggle)
  const elapsed = useElapsedSeconds()

  return (
    <div className="flex items-center gap-2">
      {running && (
        <span className="font-mono text-xs font-medium tabular-nums text-foreground">
          {formatMmSs(elapsed)}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={running}
        aria-label={running ? t('header.timerStop') : t('header.timerStart')}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-full bg-brand-500 text-brand-foreground',
          'transition-colors hover:bg-brand-400',
          FOCUS_RING,
        )}
      >
        {running ? (
          <Square className="size-3 fill-current" aria-hidden />
        ) : (
          <Play className="size-3.5 fill-current" aria-hidden />
        )}
      </button>
    </div>
  )
}
