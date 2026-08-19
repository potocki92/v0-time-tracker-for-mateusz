import { formatCurrency } from '@/lib/helpers'
import { getQuarterLabel } from '@/lib/date/quarter'

export type TooltipPayload = {
  label: string
  date?: string
  hours: number
  earningsPLN: number
  earningsEUR: number
  prevHours?: number
}

export function ChartTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: TooltipPayload }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d.hours && !d.earningsPLN) return null
  const quarterLabel = d.date ? getQuarterLabel(d.date) : null

  return (
    <div className="rounded-lg border border-border/50 bg-background/95 px-2.5 py-2 shadow-lg backdrop-blur-sm">
      {quarterLabel && (
        <p className="mb-0.5 text-2xs font-semibold text-foreground">{quarterLabel}</p>
      )}
      <p className="mb-1 text-2xs font-medium text-muted-foreground">{d.label}</p>
      <p className="text-xs font-bold tabular-nums">{d.hours.toFixed(1)}h</p>
      {d.earningsEUR > 0 ? (
        <p className="mt-0.5 text-2xs tabular-nums">
          <span className="font-semibold">{formatCurrency(d.earningsEUR, 'EUR')}</span>
          <span className="ml-1.5 text-2xs text-muted-foreground">
            {formatCurrency(d.earningsPLN, 'PLN')}
          </span>
        </p>
      ) : d.earningsPLN > 0 ? (
        <p className="mt-0.5 text-2xs font-semibold tabular-nums">
          {formatCurrency(d.earningsPLN, 'PLN')}
        </p>
      ) : null}
      {(d.prevHours ?? 0) > 0 && (
        <p className="mt-1 border-t border-border/40 pt-1 text-2xs text-muted-foreground">
          Poprzednio: {d.prevHours!.toFixed(1)}h
        </p>
      )}
    </div>
  )
}
