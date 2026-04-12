'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIME_RANGE_OPTIONS } from '../_domain/dashboard.constants'
import type { TimeRange } from '../_domain/dashboard.types'

type Props = {
  range: TimeRange
  onChangeRange: (value: TimeRange) => void
  userName?: string
  periodLabel?: string
}

export function DashboardHeader({ range, onChangeRange, userName, periodLabel }: Props) {
  return (
    <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 pb-4 pt-2 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Witaj, {userName ?? 'Użytkowniku'}!
          </h1>
          {periodLabel && (
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          )}
        </div>
        <Select value={range} onValueChange={(v) => onChangeRange(v as TimeRange)}>
          <SelectTrigger className="w-full min-w-52 sm:w-64">
            <SelectValue placeholder="Wybierz okres" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
