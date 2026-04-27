'use client'

import { cn } from '@/lib/utils'

type StatusBreakdownRowProps = {
  label: string
  count: number
  share: number
  accent: string
  highlighted?: boolean
}

export function StatusBreakdownRow({
  label,
  count,
  share,
  accent,
  highlighted,
}: StatusBreakdownRowProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}66` }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('truncate text-[13px] text-zinc-300', highlighted && 'text-white')}>
            {label}
          </p>
          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-white">{count}</p>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#161616]">
          <div
            className="h-full rounded-full"
            style={{ width: `${share}%`, backgroundColor: accent }}
            aria-hidden
          />
        </div>
      </div>
    </li>
  )
}
