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
 * Lewa strona: przelacznik sidebara (telefon) i sciezka. Na telefonie, na
 * TRASIE SEKCJI, ostatni czlon urasta do tytulu ekranu — „Obszar roboczy ›
 * Pulpit" nie mowi tam nic, czego nie mowiloby samo „Pulpit", a zjada polowe
 * paska, ktory ma zmiescic jeszcze akcje strony, dzwonek, licznik i awatar.
 * Na szerokim ekranie breadcrumb zostaje w calosci: tam miejsce jest,
 * a sciezka nadal orientuje.
 *
 * Regula jest JEDNA dla calego panelu — zadnej listy uprzywilejowanych tras.
 * Trasa zagniezdzona (`/projects/[id]`, `/invoices/analytics`) zostaje przy
 * breadcrumbie, bo ostatnim czlonem jest tam nazwa encji: w stopniu tytulu
 * ekranu urwalaby sie po dwoch slowach.
 *
 * Prawa: slot na akcje strony, powiadomienia, licznik czasu i menu
 * uzytkownika. Ten sam zestaw i te same rozmiary na kazdej trasie.
 *
 * Stala wysokosc `h-14` jest celowa — naglowek nie zmienia wysokosci przy
 * nawigacji ani po starcie licznika, wiec nawigacja nie generuje CLS.
 *
 * Powierzchnie i kolory tekstu ida ze skali panelu (`surface-*`, `zinc-*`),
 * a nie z `bg-background` / `text-foreground`: te ostatnie obsluguja rowniez
 * strefe publiczna, wiec naglowek panelu potrafil byc jasny nad ciemna trescia.
 */
export function WorkspaceHeader({ leading, trailing }: WorkspaceHeaderProps) {
  const t = useTranslations('navigation')
  // `usePathname` z warstwy i18n zwraca sciezke BEZ prefiksu jezyka, wiec
  // rejestr sekcji dopasowuje `/de/projects` tak samo jak `/projects`.
  const pathname = usePathname() ?? ''
  const section = resolveSection(pathname)
  const nested = section ? resolveNestedLabel(pathname) : undefined
  const slotRef = useHeaderSlotRef()
  // Na telefonie tytul ekranu; przy trzecim czlonie sciezki zostaje breadcrumb.
  const screenTitle = Boolean(section) && !nested

  return (
    <header
      aria-label={t('header.aria')}
      data-testid="workspace-header"
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-surface-0/80 px-[var(--header-inline-padding)] backdrop-blur"
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
            <span className="hidden shrink-0 text-zinc-400 sm:inline">
              {t(`groups.${section.group}`)}
            </span>
            <ChevronRight className="hidden size-3.5 shrink-0 text-zinc-500 sm:block" aria-hidden />
            <BreadcrumbLeaf
              label={t(`sections.${section.segment}`)}
              current={!nested}
              truncate={!nested}
              screenTitle={screenTitle}
            />
            {nested && (
              <>
                <ChevronRight className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
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
  screenTitle = false,
}: {
  label: string
  current: boolean
  truncate: boolean
  /** Na telefonie ostatni czlon urasta do tytulu ekranu — patrz docblock wyzej. */
  screenTitle?: boolean
}) {
  return (
    <span
      aria-current={current ? 'page' : undefined}
      className={cn(
        'font-medium text-white',
        truncate ? 'truncate' : 'shrink-0',
        // `text-lg`, nie `text-xl`: pasek musi zmiescic tytul RAZEM z akcja
        // strony („Nowy projekt", „Nowa faktura"). Przy 20 px „Projekty"
        // urywaly sie na 390 px do „Proje…", a urwany tytul jest gorszy niz
        // o dwa piksele mniejszy.
        screenTitle && 'text-lg font-semibold tracking-tight sm:text-xs sm:font-medium',
      )}
    >
      {label}
    </span>
  )
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60'

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
        'inline-flex size-9 items-center justify-center rounded-xl border border-hairline bg-surface-2 sm:size-8',
        'text-zinc-300 transition-colors hover:bg-surface-3 hover:text-white',
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
        <span className="font-mono text-xs font-medium tabular-nums text-white">
          {formatMmSs(elapsed)}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={running}
        aria-label={running ? t('header.timerStop') : t('header.timerStart')}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-full bg-brand-500 text-brand-foreground sm:size-8',
          'transition-colors hover:bg-brand-400',
          // Bardzo delikatna poswiata, nie neon: licznik jest jedynym
          // wypelnionym akcentem paska i ma sie od razu znajdowac kciukiem.
          'shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand-500)_12%,transparent)] sm:shadow-none',
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
