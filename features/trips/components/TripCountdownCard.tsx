'use client'

import { DashboardSectionCard } from '@/components/workspace/card/dashboard-section-card'
import { useFormat } from '@/lib/format/client'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { cn } from '@/lib/utils'
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

/** Ciemny przycisk sterujacy — nie akcja glowna, wiec nie akcent motywu. */
const MANAGE_BUTTON =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 text-2xs font-medium text-zinc-300 transition hover:border-hairline-strong hover:bg-surface-3 hover:text-white'

/**
 * Karta licznika "do powrotu / do wyjazdu". Trzy stany wizualne:
 * - `away` — odlicza dni do powrotu do domu (emerald).
 * - `home` — odlicza dni do najbliższego wyjazdu (amber/sky).
 * - `no_trips` — pusty stan z CTA, by uniknąć martwego kafelka.
 *
 * Tytul, ikone i zakres („najblizszy wyjazd") niesie naglowek
 * `DashboardSectionCard` — karta nie powtarza ich u siebie.
 */
export function TripCountdownCard({ state, onManage }: TripCountdownCardProps) {
  const fmt = useFormat()

  if (state.mode === 'no_trips') {
    return (
      <DashboardSectionCard>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-zinc-400 ring-1 ring-hairline"
            aria-hidden
          >
            <Plane className="size-5" />
          </span>
          <p className="min-w-0 flex-1 text-xs leading-[1.45] text-zinc-400 sm:text-sm">
            Brak zaplanowanych wyjazdów. Dodaj pierwszy, aby zacząć liczyć dni do
            powrotu.
          </p>
          <button type="button" onClick={onManage} className={MANAGE_BUTTON}>
            <Plus className="size-3.5" aria-hidden />
            Dodaj
          </button>
        </div>
      </DashboardSectionCard>
    )
  }

  const isAway = state.mode === 'away'
  const Icon = isAway ? Home : Plane
  const heading = isAway ? 'Powrót do domu' : 'Wyjazd do pracy'
  const accent = isAway
    ? 'text-brand-300 ring-brand-500/30 bg-brand-500/10'
    : 'text-info-300 ring-info-500/30 bg-info-500/10'
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
  const targetLabel = state.targetDate ? formatPlLongDate(fmt, state.targetDate) : null

  return (
    <DashboardSectionCard>
      <div className="flex items-center gap-3 sm:gap-4">
        <span
          className={cn(
            'inline-flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 sm:size-12',
            accent,
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <SectionEyebrow>{heading}</SectionEyebrow>
          {isToday ? (
            <p className="mt-1 text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">
              {isAway ? 'Dzisiaj wracasz do domu' : 'Dzisiaj wyjeżdżasz'}
            </p>
          ) : (
            <p className="mt-0.5 flex items-baseline gap-2 text-white">
              <span className="text-4xl font-semibold leading-none tabular-nums sm:text-h1">
                {state.days}
              </span>
              <span className="text-sm font-medium text-zinc-400">{dayWord}</span>
            </p>
          )}
          <p className="mt-1.5 truncate text-xs text-zinc-400">{subline}</p>
          {targetLabel ? (
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {isAway ? 'Powrót: ' : 'Wyjazd: '}
              <span className="text-zinc-300">{targetLabel}</span>
            </p>
          ) : null}
        </div>

        <button type="button" onClick={onManage} className={MANAGE_BUTTON}>
          <Settings2 className="size-3.5" aria-hidden />
          Zarządzaj
        </button>
      </div>
    </DashboardSectionCard>
  )
}
