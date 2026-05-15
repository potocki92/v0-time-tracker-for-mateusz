'use client'

import { formatCurrency } from '@/lib/helpers'

export type ClientRate = {
  clientId: string
  name: string
  ratePerHour: number
  currency: 'PLN' | 'EUR'
  share: number // 0..1, share of period earnings
  color: string
}

type Props = {
  blendedRate: number
  currency: 'PLN' | 'EUR'
  clientsCount: number
  rates: ClientRate[]
  periodShort: string
}

export function EffectiveRateCard({
  blendedRate,
  currency,
  clientsCount,
  rates,
  periodShort,
}: Props) {
  return (
    <section
      aria-label="Stawka efektywna"
      className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4"
    >
      <header className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Stawka efektywna
        </p>
        <span className="rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-0.5 text-[11px] text-zinc-400">
          {periodShort}
        </span>
      </header>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[26px] font-semibold tabular-nums leading-[1.15] text-white sm:text-[28px] sm:font-bold">
          {formatCurrency(blendedRate, currency)}
        </span>
        <span className="text-[12.5px] text-zinc-500 sm:text-sm">/ h</span>
      </div>
      <p className="mt-1 text-[11.5px] leading-[1.4] text-zinc-500 sm:text-xs">
        Średnia ważona ·{' '}
        {clientsCount === 1 ? '1 klient' : `${clientsCount} klientów`}
      </p>

      {rates.length > 0 && (
        <ul role="list" className="mt-4 space-y-3">
          {rates.map((r) => (
            <li key={r.clientId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-sm text-white">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="truncate">{r.name}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-300">
                  {formatCurrency(r.ratePerHour, r.currency)}
                  <span className="text-xs font-normal text-zinc-500"> /h</span>
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[#161616]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, r.share * 100)}%`,
                    backgroundColor: r.color,
                    boxShadow: `0 0 8px ${r.color}55`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
