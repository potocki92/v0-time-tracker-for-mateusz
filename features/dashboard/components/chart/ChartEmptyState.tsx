import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'
import { SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

/**
 * Pusty stan wykresu — ilustracja SVG + CTA do kalendarza.
 * Zamiast neutralnego "Brak danych" pokazujemy konkretną akcję,
 * dzięki czemu nowy użytkownik wie co zrobić dalej (activation pattern).
 */
export function ChartEmptyState() {
  return (
    <div
      className={cn(
        SURFACE.cardDashed,
        'flex min-h-[200px] flex-col items-center justify-center gap-3 px-4 py-8 text-center',
      )}
    >
      <div
        aria-hidden
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--chart-1)]/10 ring-1 ring-[var(--chart-1)]/20"
      >
        <BarChart3 className="h-7 w-7 text-[var(--chart-1)]" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Brak danych w tym okresie</p>
        <p className="text-xs text-muted-foreground">
          Dodaj wpis godzin, aby zobaczyć trend zarobków i średnią.
        </p>
      </div>
      <Button asChild size="sm" variant="outline" className="mt-1">
        <Link href="/calendar">Dodaj wpis</Link>
      </Button>
    </div>
  )
}
