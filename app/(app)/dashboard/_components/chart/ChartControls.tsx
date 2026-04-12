import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERIOD_OPTIONS, type Grouping, type Period } from './hooks/useChartState'

type Props = {
  grouping: Grouping
  period: Period
  onGroupingChange: (g: Grouping) => void
  onPeriodChange: (p: Period) => void
}

export function ChartControls({ grouping, period, onGroupingChange, onPeriodChange }: Props) {
  return (
    <>
      <Tabs value={grouping} onValueChange={(v) => onGroupingChange(v as Grouping)} className="mt-2">
        <TabsList className="h-7 w-full">
          <TabsTrigger value="daily"   className="flex-1 text-[11px]">Dziennie</TabsTrigger>
          <TabsTrigger value="weekly"  className="flex-1 text-[11px]">Tygodniowo</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 text-[11px]">Miesięcznie</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs value={period} onValueChange={(v) => onPeriodChange(v as Period)} className="mt-1.5">
        <TabsList className="h-6 w-full bg-muted/40">
          {PERIOD_OPTIONS[grouping].map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value} className="flex-1 text-[10px]">
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  )
}
