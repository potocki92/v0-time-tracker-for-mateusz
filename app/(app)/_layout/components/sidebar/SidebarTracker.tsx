'use client'

/**
 * SidebarTracker — minimalistyczny widget aktywnego pomiaru czasu.
 *
 * Stan `running` jest w pełni kontrolowany przez użytkownika: widget startuje
 * w stanie zatrzymanym i tyka tylko, gdy `running === true`. Przyciski
 * Start / Stop są jedynym źródłem prawdy — żaden useEffect nie nadpisuje
 * tego stanu.
 */

import * as React from 'react'
import { Play, Square } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface SidebarTrackerProps {
  label?: string
  /** Czy tracker ma startować już uruchomiony (domyślnie false). */
  defaultRunning?: boolean
  /** Liczba sekund startowych. */
  initialSeconds?: number
  /** Wywoływane przy zmianie stanu running (true=start, false=stop). */
  onToggle?: (running: boolean) => void
}

const formatHMS = (total: number) => {
  const t = Math.max(0, Math.floor(total))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function SidebarTracker({
  label = 'Śledzenie · Im Winkel 51',
  defaultRunning = false,
  initialSeconds = 0,
  onToggle,
}: SidebarTrackerProps) {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed' && !isMobile

  const [running, setRunning] = React.useState(defaultRunning)
  const [tick, setTick] = React.useState(initialSeconds)

  React.useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setTick((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  const toggle = () => {
    const next = !running
    setRunning(next)
    onToggle?.(next)
  }

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={`${label} • ${formatHMS(tick)}`}
        aria-pressed={running}
        aria-label={running ? 'Zatrzymaj śledzenie' : 'Uruchom śledzenie'}
        className="mx-auto flex size-8 items-center justify-center rounded-md border border-sidebar-border/80 bg-sidebar-accent/40 transition-colors hover:bg-sidebar-accent/70"
      >
        <span
          className={cn(
            'size-1.5 rounded-full bg-sidebar-primary',
            running && 'animate-[claudePulse_2.4s_ease-in-out_infinite]',
          )}
        />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'rounded-md border border-sidebar-border/80 bg-sidebar-accent/30',
        'px-3 py-2.5',
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={cn(
            'size-1.5 rounded-full',
            running ? 'animate-[claudePulse_2.4s_ease-in-out_infinite] bg-sidebar-primary' : 'bg-sidebar-foreground/35',
          )}
        />
        <span className="truncate text-[11px] text-sidebar-foreground/70">{label}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'font-mono text-[15px] font-medium tabular-nums tracking-tight',
            running ? 'text-sidebar-foreground' : 'text-sidebar-foreground/60',
          )}
        >
          {formatHMS(tick)}
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={running}
          aria-label={running ? 'Zatrzymaj śledzenie' : 'Uruchom śledzenie'}
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded border border-sidebar-border/80 bg-transparent px-2',
            'text-[11px] text-sidebar-foreground/70',
            'transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
          )}
        >
          {running ? (
            <>
              <Square className="size-2.5" strokeWidth={2.5} />
              Stop
            </>
          ) : (
            <>
              <Play className="size-2.5 fill-current" strokeWidth={2.5} />
              Start
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes claudePulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.95; }
        }
      `}</style>
    </div>
  )
}
