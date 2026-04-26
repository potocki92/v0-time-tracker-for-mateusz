'use client'

/**
 * SidebarTracker — minimalistyczny widget aktywnego pomiaru czasu.
 *
 * Wzorowany na panelu z Claude/Linear: subtelna karta, kropka statusu z
 * łagodnym pulsowaniem, monospaced timer, drugorzędny przycisk Stop.
 * W trybie zwiniętego sidebara redukuje się do samej kropki + ikony.
 */

import * as React from 'react'
import { Square } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface SidebarTrackerProps {
  label?: string
  /** Liczba sekund — jeśli podana, komponent sam tyka. */
  seconds?: number
  onStop?: () => void
}

const formatHMS = (total: number) => {
  const t = Math.max(0, Math.floor(total))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function SidebarTracker({
  label = 'Tracking · Im Winkel 51',
  seconds,
  onStop,
}: SidebarTrackerProps) {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed' && !isMobile

  const [tick, setTick] = React.useState(seconds ?? 8048)
  React.useEffect(() => {
    if (seconds != null) {
      setTick(seconds)
      return
    }
    const id = window.setInterval(() => setTick((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [seconds])

  if (isCollapsed) {
    return (
      <div
        title={`${label} • ${formatHMS(tick)}`}
        className="mx-auto flex size-8 items-center justify-center rounded-md border border-sidebar-border/80 bg-sidebar-accent/40"
      >
        <span className="size-1.5 animate-[claudePulse_2.4s_ease-in-out_infinite] rounded-full bg-sidebar-primary" />
      </div>
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
        <span className="size-1.5 animate-[claudePulse_2.4s_ease-in-out_infinite] rounded-full bg-sidebar-primary" />
        <span className="truncate text-[11px] text-sidebar-foreground/70">{label}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[15px] font-medium tabular-nums tracking-tight text-sidebar-foreground">
          {formatHMS(tick)}
        </span>
        <button
          type="button"
          onClick={onStop}
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded border border-sidebar-border/80 bg-transparent px-2',
            'text-[11px] text-sidebar-foreground/70',
            'transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
          )}
        >
          <Square className="size-2.5" strokeWidth={2.5} />
          Stop
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
