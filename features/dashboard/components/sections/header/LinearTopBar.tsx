'use client'

import { Bell, ChevronRight, Play } from 'lucide-react'
import { usePageLabel } from '@/hooks/usePageLabel'

type Props = {
  notificationsCount?: number
  onTimerClick?: () => void
  onBellClick?: () => void
}

/**
 * Górny pasek aplikacji — wyświetlany TYLKO na desktopie (`md:flex`).
 * Mobilna nawigacja jest obsługiwana przez `MobileHeader` (hamburger + tytuł).
 *
 * Treść:
 *   • Breadcrumb: {sekcja sidebara} › {bieżąca podstrona}  (np. "Obszar roboczy › Pulpit")
 *   • Akcje: powiadomienia + szybki timer
 */
export function LinearTopBar({
  notificationsCount = 0,
  onTimerClick,
  onBellClick,
}: Props) {
  const { section, page } = usePageLabel()

  return (
    <header className="sticky top-0 z-40 -mx-3 hidden border-b border-[#1a1a1a] bg-black/85 px-3 py-2 backdrop-blur-md md:-mx-4 md:flex md:items-center md:justify-between md:px-4">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs">
        <span className="text-zinc-500">{section}</span>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-700" aria-hidden />
        <span className="font-medium text-white">{page}</span>
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Powiadomienia${notificationsCount ? ` (${notificationsCount} nowych)` : ''}`}
          onClick={onBellClick}
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0a0a0a] text-zinc-400 transition hover:bg-[#111] hover:text-white"
        >
          <Bell className="h-4 w-4" aria-hidden />
          {notificationsCount > 0 && (
            <span className="absolute right-1.5 top-1.5 block h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-[#0a0a0a]" />
          )}
        </button>

        <button
          type="button"
          aria-label="Uruchom timer"
          onClick={onTimerClick}
          className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-black shadow-[0_0_14px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition hover:bg-emerald-400 active:scale-95"
        >
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
        </button>
      </div>
    </header>
  )
}
