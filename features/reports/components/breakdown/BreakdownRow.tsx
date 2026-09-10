'use client'

import { useFormat } from '@/lib/format/client'
import type { BreakdownItem } from '../../domain'
import type { CURRENCY } from '@/lib/types'

type Props = {
  item: BreakdownItem
  /** Etykieta pozycji bez przypisania — nazwy klientow sa dana, ta nie. */
  fallbackLabel: string
  currency: CURRENCY
  /** Gotowy opis udzialu dla czytnika ekranu. */
  shareLabel: string
}

/**
 * Wiersz podzialu: nazwa, godziny, udzial, wartosc pracy i — drugorzednie —
 * stawka efektywna.
 *
 * Jeden wiersz obsluguje wszystkie trzy przekroje. Klient, projekt i tag maja
 * identyczna STRUKTURE informacji, wiec dziela komponent; gdyby ktorys
 * potrzebowal innych danych, dostalby wlasny, a nie flage.
 */
export function BreakdownRow({ item, fallbackLabel, currency, shareLabel }: Props) {
  const fmt = useFormat()
  const width = Math.max(0, Math.min(100, item.share * 100))

  return (
    <li className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm text-zinc-200">{item.label ?? fallbackLabel}</span>
        <span className="shrink-0 tabular-nums text-sm text-zinc-300">
          {fmt.hours(item.hours)}
          <span className="ml-2 text-xs text-zinc-400">{fmt.percent(item.share)}</span>
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={shareLabel}
        className="h-1.5 w-full overflow-hidden rounded-full bg-track"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-zinc-300 to-white"
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between gap-3 text-2xs text-zinc-400">
        <span className="tabular-nums">{fmt.money(item.valueBaseMinor, currency)}</span>
        <span className="tabular-nums">{fmt.rate(item.effectiveHourlyRateMinor, currency)}</span>
      </div>
    </li>
  )
}
