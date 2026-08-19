import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERIOD_OPTIONS, type Grouping, type Period } from './hooks/useChartState'

type Props = {
  grouping: Grouping
  period: Period
  onGroupingChange: (g: Grouping) => void
  onPeriodChange: (p: Period) => void
}

type GroupingLabel = { short: string; full: string }

const GROUPING_LABELS: Record<Grouping, GroupingLabel> = {
  daily: { short: 'Dzień', full: 'Dziennie' },
  weekly: { short: 'Tydz.', full: 'Tygodniowo' },
  monthly: { short: 'M-c', full: 'Miesięcznie' },
  quarterly: { short: 'Kw.', full: 'Kwartalnie' },
}

/**
 * Dwie kontrolki: grouping (gęstość słupków) × period (okno czasu).
 * Opcje period są zawężane do dozwolonych dla bieżącego grouping
 * (PERIOD_OPTIONS). Dzięki temu np. „dziennie + rok" działa, a niedozwolone
 * kombinacje typu „kwartalnie + tydzień" w ogóle się nie pokazują.
 *
 * Mobile: krótkie etykiety (Dzień / Tydz. / M-c / Kw.), żeby 4 taby mieściły się
 * w jednym rzędzie; od sm+ pełne („Dziennie" itd.) — visuallyHidden dla SR.
 */
export function ChartControls({
  grouping,
  period,
  onGroupingChange,
  onPeriodChange,
}: Props) {
  return (
    <>
      <Tabs
        value={grouping}
        onValueChange={(v) => onGroupingChange(v as Grouping)}
        className="mt-1"
      >
        <TabsList aria-label="Grupowanie wykresu zarobków" className="h-7 w-full">
          {(Object.keys(GROUPING_LABELS) as Grouping[]).map((g) => (
            <TabsTrigger
              key={g}
              value={g}
              // Radix kieruje `aria-controls` na panel taba, ktorego tu nie ma —
              // wykres zyje poza <Tabs>, wiec atrybut wskazywal na nieistniejacy
              // element (aria-valid-attr-value). Kontrolki sa segmentowane, nie
              // zakladkowe; sama nawigacja klawiatura z Radiksa zostaje.
              aria-controls={undefined}
              className="min-w-0 flex-1 text-2xs"
            >
              <span className="sm:hidden">{GROUPING_LABELS[g].short}</span>
              <span className="hidden sm:inline">{GROUPING_LABELS[g].full}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Tabs
        value={period}
        onValueChange={(v) => onPeriodChange(v as Period)}
        className="mt-1.5"
      >
        <TabsList aria-label="Zakres okresu wykresu" className="h-6 w-full bg-muted/40">
          {PERIOD_OPTIONS[grouping].map((opt) => (
            <TabsTrigger
              key={opt.value}
              value={opt.value}
              aria-controls={undefined}
              className="min-w-0 flex-1 text-2xs"
            >
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  )
}
