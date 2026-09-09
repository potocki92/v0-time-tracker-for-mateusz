import type { ReactNode } from 'react'

/**
 * Prymitywy marketingowej repliki panelu.
 *
 * Odwzorowuja `components/ui/tokens.ts` (SURFACE.card / cardNested) i
 * `components/common/stat/StatTile` — te same promienie, te same warstwy
 * powierzchni, ta sama drabinka typografii. Kopia, nie import: komponenty
 * aplikacji sa klienckie, ciagna store'y i zapytania, a landing ma zostac
 * konsumentem designu, nie produktu.
 */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`lp-card p-3 ${className}`}>{children}</div>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="lp-t9 font-semibold uppercase tracking-[0.16em] text-zinc-400">
      {children}
    </span>
  )
}

export function StatTile({
  label,
  value,
  meta,
  accent = false,
  className = '',
}: {
  label: string
  value: string
  meta?: string
  accent?: boolean
  className?: string
}) {
  return (
    <div className={`lp-card-nested p-2.5 ${className}`}>
      <Eyebrow>{label}</Eyebrow>
      <p
        className={`mt-1.5 text-base font-semibold leading-none tabular-nums sm:text-lg ${
          accent ? 'text-[var(--lp-accent)]' : 'text-white'
        }`}
      >
        {value}
      </p>
      {meta && <p className="mt-1 truncate lp-t10 leading-tight text-zinc-400">{meta}</p>}
    </div>
  )
}

export function Pill({
  children,
  tone = 'mute',
}: {
  children: ReactNode
  tone?: 'mute' | 'accent'
}) {
  return <span className={tone === 'accent' ? 'lp-pill lp-pill-accent' : 'lp-pill'}>{children}</span>
}

/** Kropka klienta — ten sam sygnal, co pasek koloru pod komorka dnia. */
export function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-1.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  )
}

/** Slupki godzin. `activeIndex` odpowiada „teraz" z wykresu na Pulpicie. */
export function Bars({
  values,
  labels,
  activeIndex,
  className = '',
}: {
  values: readonly number[]
  labels?: readonly string[]
  activeIndex?: number
  className?: string
}) {
  const max = Math.max(...values, 1)
  return (
    <div className={`flex items-end gap-1.5 ${className}`}>
      {values.map((value, index) => (
        // `h-full` na kolumnie jest warunkiem, zeby procentowa wysokosc
        // slupka mialo od czego liczyc — bez tego kazdy slupek ma 0 px.
        <div key={index} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
          <div
            className={`w-full rounded-[2px] ${index === activeIndex ? 'lp-bar-accent' : 'lp-bar'}`}
            style={{ height: `${Math.max(3, (value / max) * 100)}%` }}
          />
          {labels && (
            <span className="truncate text-center lp-t8 leading-none text-zinc-400">
              {labels[index]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** Pasek postepu — budzet projektu, udzial w raportach. */
export function Meter({ value, tone = 'neutral' }: { value: number; tone?: 'neutral' | 'accent' }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${tone === 'accent' ? 'bg-[var(--lp-accent)]' : 'bg-white/45'}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
