'use client'

import { useEffect, useState } from 'react'
import { toDateKey } from '@/lib/date/format'
import { formatDate } from '@/lib/format'

type Props = {
  appName?: string
  version?: string
  syncedAt?: Date
}

function relative(now: Date, then: Date): string {
  const diff = Math.max(0, now.getTime() - then.getTime())
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'przed chwilą'
  if (m === 1) return '1 min temu'
  if (m < 60) return `${m} min temu`
  const h = Math.floor(m / 60)
  if (h === 1) return '1 godz. temu'
  if (h < 24) return `${h} godz. temu`
  const d = Math.floor(h / 24)
  return `${d} dni temu`
}

/**
 * Wspólna stopka aplikacji w stylu "TimeTracker · 27 kwi 2026 · v1.0.0".
 * Używana na dashboardzie i kalendarzu — gwarantuje wizualny parytet
 * w całym module zalogowanego użytkownika.
 */
export function AppFooter({
  appName = 'TimeTracker',
  version = 'v1.0.0',
  syncedAt,
}: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const today = formatDate(toDateKey(now), 'long')

  const synced = syncedAt ? relative(now, syncedAt) : null

  // Stopka pojawia sie i na tle strony (token), i wewnatrz twardo czarnych
  // kontenerow /dashboard i /calendar. Zaden staly kolor nie ma 4.5:1 na obu,
  // wiec dziedziczy kolor tekstu powierzchni i tylko go przygasza.
  return (
    <p className="px-2 pt-2 text-center font-mono text-2xs tracking-wider opacity-70">
      {appName}
      {synced && <> · zsynchronizowano {synced}</>}{' '}
      · {today} · {version}
    </p>
  )
}
