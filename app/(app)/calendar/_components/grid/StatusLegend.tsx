import { cn } from '@/lib/utils'
import { STATUS_CONFIG, WORK_STATUS_ORDER } from '../../_domain/calendar.constants'

/**
 * Legenda pod gridem kalendarza — pomaga szybko odczytać znaczenie kolorów.
 * Renderowana horyzontalnie ze scrollem na wąskich ekranach.
 */
export function StatusLegend() {
  return (
    <div className="-mx-1 flex items-center gap-3 overflow-x-auto px-1 pb-1 scrollbar-none">
      {WORK_STATUS_ORDER.map((status) => {
        const cfg = STATUS_CONFIG[status]
        return (
          <div
            key={status}
            className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground"
          >
            <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
            <span>{cfg.label}</span>
          </div>
        )
      })}
    </div>
  )
}
