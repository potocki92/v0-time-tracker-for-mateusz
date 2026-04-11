'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIME_RANGE_OPTIONS } from '../_domain/dashboard.constants'

type Props = {
  range: string
  onChangeRange: (value: string) => void
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
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>

        <Select value={range} onValueChange={onChangeRange}>
          <SelectTrigger className="w-full min-w-52 sm:w-64">
            <SelectValue placeholder="Wybierz okres" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}