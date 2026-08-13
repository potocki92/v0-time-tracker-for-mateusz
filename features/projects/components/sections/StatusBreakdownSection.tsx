'use client'

import { cn } from '@/lib/utils'
import { useProjectsData } from '../../hooks/useProjectsData'
import { useStatusBreakdown } from '../../hooks/useStatusBreakdown'
import { LinearCard } from '../linear/LinearCard'
import { LINEAR } from '../linear/linear.tokens'

/**
 * Jeden pasek segmentowy + legenda. Poprzednia wersja renderowała cztery
 * wiersze z własnymi paskami — dwa z nich to były zwykle zera, a liczby i tak
 * dublowały kafelki KPI nad kartą.
 */
export function StatusBreakdownSection() {
  const { data } = useProjectsData()
  const breakdown = useStatusBreakdown(data.projects)
  const rows = breakdown.rows.filter((row) => row.count > 0)

  return (
    <LinearCard
      eyebrow="Statusy"
      badge={
        <span
          className={cn(
            'rounded-md border px-2 py-0.5 text-[11px] text-zinc-300',
            LINEAR.border,
            LINEAR.surfaceElevated,
          )}
        >
          {breakdown.total} projektów
        </span>
      }
    >
      <div className="space-y-3 px-4 py-4 sm:px-5">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-400">Brak projektów.</p>
        ) : (
          <>
            <div className={cn('flex h-2 w-full gap-0.5 overflow-hidden rounded-full', LINEAR.track)}>
              {rows.map((row) => (
                <span
                  key={row.status}
                  aria-hidden
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${row.share}%`, backgroundColor: row.accent }}
                />
              ))}
            </div>

            <ul role="list" className="flex flex-wrap gap-x-4 gap-y-2">
              {rows.map((row) => (
                <li key={row.status} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.accent }}
                  />
                  <span className="text-[12.5px] text-zinc-300">{row.label}</span>
                  <span className="text-[12.5px] font-semibold tabular-nums text-white">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </LinearCard>
  )
}
