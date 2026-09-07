import { cn } from '@/lib/utils'
import { STATUS_CONFIG, WORK_STATUS_ORDER } from '../../domain/calendar.constants'

/**
 * Legenda pod gridem kalendarza — pomaga szybko odczytać znaczenie kolorów.
 * Zawija się zamiast scrollować: pięć statusów mieściło się na 390 px dokładnie
 * co do piksela, więc ostatni ("Dzień wolny") przycinała krawędź karty, a
 * scrollbara na mobile nie widać.
 */
export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {WORK_STATUS_ORDER.map((status) => {
        const cfg = STATUS_CONFIG[status]
        return (
          <div
            key={status}
            className="flex shrink-0 items-center gap-1.5 text-2xs text-zinc-400"
          >
            <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
            <span>{cfg.label}</span>
          </div>
        )
      })}
    </div>
  )
}
