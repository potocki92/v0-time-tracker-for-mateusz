'use client'

import { Home, Plane, Plus, Settings2 } from 'lucide-react'
import {
  formatPlLongDate,
  pluralizeDni,
  type TripCountdownState,
} from '../domain'

interface TripCountdownCardProps {
  state: TripCountdownState
  onManage: () => void
}

/**
 * Karta licznika "do powrotu / do wyjazdu". Trzy stany wizualne:
 * - `away` — odlicza dni do powrotu do domu (emerald).
 * - `home` — odlicza dni do najbliższego wyjazdu (amber/sky).
 * - `no_trips` — pusty stan z CTA, by uniknąć martwego kafelka.
 */
export function TripCountdownCard({ state, onManage }: TripCountdownCardProps) {
  if (state.mode === 'no_trips') {
    return (
      <section
        aria-label="Wyjazdy"
        className="rounded-2xl border border-hairline bg-surface-1"
      >
        <header className="flex items-center justify-between border-b border-hairline px-4 py-3 sm:px-5">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Wyjazdy
          </p>
          <button
            type="button"
            onClick={onManage}
            className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface-2 px-2 py-1 text-2xs font-medium text-zinc-300 transition hover:border-hairline-strong hover:bg-surface-3"
          >
            <Plus className="h-3 w-3" aria-hidden />
            Dodaj
          </button>
        </header>
        <div className="px-4 py-6 text-center text-sm text-zinc-400 sm:px-5">
          Brak zaplanowanych wyjazdów. Dodaj pierwszy, aby zacząć liczyć dni do
          powrotu.
        </div>
      </section>
    )
  }

  const isAway = state.mode === 'away'
  const Icon = isAway ? Home : Plane
  const heading = isAway ? 'Powrót do domu' : 'Wyjazd do pracy'
  const accent = isAway
    ? 'text-emerald-300 ring-emerald-500/30 bg-emerald-500/10'
    : 'text-sky-300 ring-sky-500/30 bg-sky-500/10'
  const destination = state.trip?.destination?.trim()
  const subline = isAway
    ? destination
      ? `Wracasz z: ${destination}`
      : 'Wracasz z trasy'
    : destination
      ? `Następny wyjazd: ${destination}`
      : 'Następny wyjazd'

  const isToday = state.days === 0
  const dayWord = pluralizeDni(state.days)
  const targetLabel = state.targetDate ? formatPlLongDate(state.targetDate) : null

  return (
    <section
      aria-label="Licznik wyjazdu"
      className="rounded-2xl border border-hairline bg-surface-1"
    >
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3 sm:px-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Wyjazdy
        </p>
        <button
          type="button"
          onClick={onManage}
          className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface-2 px-2 py-1 text-2xs font-medium text-zinc-300 transition hover:border-hairline-strong hover:bg-surface-3"
        >
          <Settings2 className="h-3 w-3" aria-hidden />
          Zarządzaj
        </button>
      </header>

      <div className="px-4 py-5 sm:px-5">
        <div className="flex items-start gap-4">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accent}`}
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              {heading}
            </p>
            {isToday ? (
              <p className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                {isAway ? 'Dzisiaj wracasz do domu' : 'Dzisiaj wyjeżdżasz'}
              </p>
            ) : (
              <p className="mt-1 flex items-baseline gap-2 text-white">
                <span className="text-h1 font-semibold leading-none tabular-nums">
                  {state.days}
                </span>
                <span className="text-base font-medium text-zinc-400">{dayWord}</span>
              </p>
            )}
            <p className="mt-1 truncate text-xs text-zinc-400">{subline}</p>
            {targetLabel ? (
              <p className="mt-0.5 text-xs text-zinc-400">
                {isAway ? 'Powrót: ' : 'Wyjazd: '}
                <span className="text-zinc-300">{targetLabel}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
