import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, WORK_STATUS_ORDER } from '../../_domain/calendar.constants'
import type { WorkStatus } from '../../_domain/calendar.types'

interface Props {
  value: WorkStatus
  onChange: (value: WorkStatus) => void
}

export function StatusSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Status dnia
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as WorkStatus)}>
        <SelectTrigger className="h-10 sm:h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WORK_STATUS_ORDER.map((status) => {
            const cfg = STATUS_CONFIG[status]
            return (
              <SelectItem key={status} value={status}>
                <span className="flex items-center gap-2 text-sm">
                  <span className={cn('inline-block h-2 w-2 rounded-full', cfg.dot)} />
                  {cfg.label}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
