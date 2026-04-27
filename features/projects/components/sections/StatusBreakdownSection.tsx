'use client'

import { useProjectsData } from '../../hooks/useProjectsData'
import { useStatusBreakdown } from '../../hooks/useStatusBreakdown'
import { LinearCard } from '../linear/LinearCard'
import { StatusBreakdownRow } from '../linear/StatusBreakdownRow'

export function StatusBreakdownSection() {
  const { data } = useProjectsData()
  const breakdown = useStatusBreakdown(data.projects)

  return (
    <LinearCard
      eyebrow="Status breakdown"
      badge={
        <span className="rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-0.5 text-[11px] text-zinc-300">
          {breakdown.total} total
        </span>
      }
    >
      <ul role="list" className="divide-y divide-[#161616]">
        {breakdown.rows.map((row) => (
          <StatusBreakdownRow
            key={row.status}
            label={row.label}
            count={row.count}
            share={row.share}
            accent={row.accent}
            highlighted={row.status === 'in_progress'}
          />
        ))}
      </ul>
    </LinearCard>
  )
}
