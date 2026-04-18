import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { GroupingParam } from '../../_hooks/useDashboardFilters'
import type { ChartGrouping } from '../../_domain/dashboard.types'

type Props = {
  grouping: GroupingParam
  effectiveGrouping: ChartGrouping
  onGroupingChange: (g: GroupingParam) => void
}

const GROUPING_LABELS: Record<ChartGrouping, string> = {
  daily: 'Dziennie',
  weekly: 'Tygodniowo',
  monthly: 'Miesięcznie',
  quarterly: 'Kwartalnie',
}

/**
 * Jedna kontrolka zamiast dwóch — grouping jest domyślnie `auto`
 * (heurystyka w useDashboardFilters dobiera agregację do długości zakresu).
 * Wariant `auto` jest pierwszą zakładką → większość użytkowników nigdy nie
 * musi myśleć o gęstości słupków.
 */
export function ChartControls({ grouping, effectiveGrouping, onGroupingChange }: Props) {
  const autoLabel = `Auto (${GROUPING_LABELS[effectiveGrouping].toLowerCase()})`

  return (
    <Tabs
      value={grouping}
      onValueChange={(v) => onGroupingChange(v as GroupingParam)}
      className="mt-2"
    >
      <TabsList aria-label="Grupowanie wykresu zarobków" className="h-7 w-full">
        <TabsTrigger value="auto" className="flex-1 text-[11px]">
          {autoLabel}
        </TabsTrigger>
        <TabsTrigger value="daily" className="flex-1 text-[11px]">Dziennie</TabsTrigger>
        <TabsTrigger value="weekly" className="flex-1 text-[11px]">Tygodniowo</TabsTrigger>
        <TabsTrigger value="monthly" className="flex-1 text-[11px]">Miesięcznie</TabsTrigger>
        <TabsTrigger value="quarterly" className="flex-1 text-[11px]">Kwartalnie</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
