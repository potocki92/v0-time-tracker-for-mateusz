'use client'

import { useEffect, useState } from 'react'

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

export function Footer({
  appName = 'TimeTracker',
  version = 'v1.0.0',
  syncedAt,
}: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const today = now.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const synced = syncedAt ? relative(now, syncedAt) : null

  return (
    <p className="px-2 pt-2 text-center font-mono text-[10px] tracking-wider text-zinc-600">
      {appName}
      {synced && <> · zsynchronizowano {synced}</>}
      {' '}· {today} · {version}
    </p>
  )
}
