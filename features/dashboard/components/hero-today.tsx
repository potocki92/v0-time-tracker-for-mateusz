'use client'

import Link from 'next/link'
import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/lib/format/client'
import { getTodayLocalDateString } from '@/lib/helpers'
import { useTimerStore } from '@/hooks/stores/useTimerStore'
import { useTrips } from '@/features/trips'
import { computeTripCountdown, pluralizeDni } from '@/features/trips/domain'
import { useMemo } from 'react'
import { computeTodayGlance } from '../lib/today'
import { useDashboardSlice } from '../hooks/useDashboardSlice'
import { selectClients, selectWorkEntries } from '../hooks/dashboardSelectors'
import { useEffectiveEurRate } from '../hooks/usePreferencesStore'

/**
 * Jedyna sekcja nad zagieciem, ktora odpowiada na pytanie „co z dzisiaj".
 *
 * Zero wykresow i zero drugiego poziomu naglowkow — to jest ta jedna karta,
 * ktora ma dac odpowiedz bez przewijania. Akcja glowna nie implementuje
 * logowania od nowa: prowadzi do formularza dnia w Kalendarzu (`?day=`).
 */
export function HeroToday() {
  const fmt = useFormat()
  const workEntries = useDashboardSlice(selectWorkEntries)
  const clients = useDashboardSlice(selectClients)
  const eurRate = useEffectiveEurRate()
  const { trips } = useTrips()

  const today = getTodayLocalDateString()
  const glance = useMemo(
    () => computeTodayGlance({ workEntries, clients, eurRate, todayIso: today }),
    [workEntries, clients, eurRate, today],
  )
  const countdown = useMemo(() => computeTripCountdown(trips), [trips])

  const running = useTimerStore((state) => state.running)
  const toggleTimer = useTimerStore((state) => state.toggle)

  return (
    <section
      aria-label="Dzisiaj"
      className="rounded-lg border border-hairline bg-surface-1 p-4 sm:p-5"
    >
      {/* Bez datownika: powitanie nad Pulpitem pokazuje juz „PONIEDZIALEK ·
          07 WRZ 2026 · KW 37/2026", a tytul sekcji niesie naglowek nad karta. */}
      <p className="text-3xl font-semibold leading-[1.15] tabular-nums text-white sm:text-4xl">
        {glance.hours > 0 ? fmt.hours(glance.hours) : 'Brak wpisu na dziś'}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs text-zinc-400 sm:text-xs">
        {running && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 font-medium text-zinc-200 ring-1 ring-hairline">
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-[var(--chart-1)] animate-[claudePulse_2.4s_ease-in-out_infinite]"
            />
            Timer leci
          </span>
        )}
        {countdown.mode === 'away' && (
          <span>
            Powrót do domu za{' '}
            <span className="font-medium text-zinc-200">{pluralizeDni(countdown.days)}</span>
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* min-h-[44px]: to jest najczesciej dotykany przycisk w calej aplikacji. */}
        <Button asChild variant="accent" className="min-h-[44px]">
          <Link href={`/calendar?day=${today}`}>
            Dodaj dziś: {fmt.hours(glance.normHours, { decimals: 0 })}
            {glance.defaultClientName ? ` · ${glance.defaultClientName}` : ''}
          </Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="min-h-[44px]"
          onClick={toggleTimer}
          aria-pressed={running}
        >
          {running ? (
            <Square className="size-3.5 fill-current" aria-hidden />
          ) : (
            <Play className="size-3.5 fill-current" aria-hidden />
          )}
          {running ? 'Zatrzymaj timer' : 'Uruchom timer'}
        </Button>
      </div>
    </section>
  )
}
