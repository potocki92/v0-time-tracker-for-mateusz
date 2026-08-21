'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, ChevronRight, Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useElapsedSeconds, useTimerStore } from '@/hooks/stores/useTimerStore'
import {
  WORKSPACE_GROUP_LABELS,
  resolveNestedLabel,
  resolveSection,
} from '@/lib/workspace/sections'
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
  const pathname = usePathname() ?? ''
  const section = resolveSection(pathname)
  const nested = section ? resolveNestedLabel(pathname) : undefined
  const slotRef = useHeaderSlotRef()

  return (
    <header
      aria-label="Nagłówek obszaru roboczego"
      data-testid="workspace-header"
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-background/80 px-[var(--header-inline-padding)] backdrop-blur"
    >
      {leading}

      <nav
        aria-label="Ścieżka nawigacji"
        data-testid="workspace-breadcrumb"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-xs"
      >
        {section && (
          <>
            {/* Na telefonie zostaje sama etykieta sekcji — grupa i separator
                zabieraly polowe paska, nie wnoszac nic ponad to, co widac
                w sidebarze. */}
            <span className="hidden shrink-0 text-muted-foreground sm:inline">
              {WORKSPACE_GROUP_LABELS[section.group]}
            </span>
            <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" aria-hidden />
            <BreadcrumbLeaf label={section.label} current={!nested} truncate={!nested} />
            {nested && (
              <>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <BreadcrumbLeaf label={nested} current truncate />
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
  return (
    <button
      type="button"
      aria-label="Powiadomienia"
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
        aria-label={running ? 'Zatrzymaj śledzenie' : 'Uruchom śledzenie'}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-full bg-emerald-500 text-black',
          'transition-colors hover:bg-emerald-400',
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
