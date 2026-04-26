'use client'

import { Bell, Play } from 'lucide-react'

type Props = {
  title?: string
  subtitle?: string
  notificationsCount?: number
  onTimerClick?: () => void
  onBellClick?: () => void
}

export function LinearTopBar({
  title = 'Dashboard',
  subtitle,
  notificationsCount = 0,
  onTimerClick,
  onBellClick,
}: Props) {
  return (
    <header className="sticky top-0 z-40 -mx-3 border-b border-[#1a1a1a] bg-black/80 px-3 pb-3 pt-3 backdrop-blur-md sm:-mx-4 sm:px-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium tracking-tight leading-[1.25] text-white sm:text-2xl sm:font-semibold">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-[11.5px] text-zinc-500 sm:text-xs">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Powiadomienia${notificationsCount ? ` (${notificationsCount} nowych)` : ''}`}
            onClick={onBellClick}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] text-zinc-400 transition hover:bg-[#111] hover:text-white"
          >
            <Bell className="h-4.5 w-4.5" aria-hidden />
            {notificationsCount > 0 && (
              <span className="absolute right-2 top-2 block h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-[#0a0a0a]" />
            )}
          </button>

          <button
            type="button"
            aria-label="Uruchom timer"
            onClick={onTimerClick}
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-black shadow-[0_0_20px_-4px_rgba(34,197,94,0.6)] transition hover:bg-emerald-400 hover:shadow-[0_0_24px_-2px_rgba(34,197,94,0.7)] active:scale-95"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  )
}
