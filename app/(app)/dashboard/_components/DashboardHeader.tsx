'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIME_RANGE_OPTIONS } from '../_domain/dashboard.constants'
import type { TimeRange } from '../_domain/dashboard.types'

type Props = {
  range: TimeRange
  onChangeRange: (value: TimeRange) => void
  userName?: string
  periodLabel?: string
}

/**
 * Segmenty pokazywane jako pigułki — szybki dostęp do najczęstszych zakresów.
 * Rzadsze opcje (all, quarters, previous_*) są w fallback `Select` na prawym końcu.
 */
const PRIMARY_RANGES: TimeRange[] = [
  'current_week',
  'current_month',
  'current_quarter',
  'current_year',
]

const PRIMARY_LABELS: Record<TimeRange, string> = {
  current_week: 'Tydzień',
  previous_week: 'Poprz. tydzień',
  current_month: 'Miesiąc',
  previous_month: 'Poprz. miesiąc',
  current_quarter: 'Kwartał',
  current_year: 'Rok',
  all: 'Wszystko',
}

export function DashboardHeader({ range, onChangeRange, userName, periodLabel }: Props) {
  const isPrimary = PRIMARY_RANGES.includes(range)
  const tabsValue = isPrimary ? range : 'more'

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 pb-4 pt-2 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Witaj, {userName ?? 'Użytkowniku'}!
          </h1>
          {periodLabel && (
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tabs
            value={tabsValue}
            onValueChange={(v) => {
              if (v !== 'more') onChangeRange(v as TimeRange)
            }}
            className="flex-1 lg:flex-none"
          >
            <TabsList aria-label="Zakres czasu dashboardu" className="h-9 w-full lg:w-auto">
              {PRIMARY_RANGES.map((r) => (
                <TabsTrigger key={r} value={r} className="flex-1 px-3 text-xs sm:text-sm lg:flex-none">
                  {PRIMARY_LABELS[r]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Select value={range} onValueChange={(v) => onChangeRange(v as TimeRange)}>
            <SelectTrigger
              aria-label="Więcej zakresów"
              className="h-9 w-9 shrink-0 p-0 [&>svg:last-child]:mx-auto [&>span]:sr-only"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
