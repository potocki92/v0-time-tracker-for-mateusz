import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'

type Props = {
  trend: number | null
  totalHours: number
  totalEarnings: { pln: number; eur: number }
  /** Srednia z okresu — ta sama, ktora wykres rysuje linia odniesienia. */
  avgHours: number
}

/**
 * Nagłówek w tej samej anatomii, co karty Godziny i Aktywność: eyebrow,
 * duża wartość `text-3xl tabular-nums`, wiersz `meta`. Wcześniej ta jedna
 * karta jechała na shadcnowym `CardTitle`/`CardDescription`, czyli innym
 * stopniu pisma i innej hierarchii niż wszystkie sąsiadki w kolumnie.
 */
export function ChartHeader({ trend, totalHours, totalEarnings, avgHours }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <SectionEyebrow>Analiza aktywności</SectionEyebrow>
        <p className="mt-2 text-3xl font-semibold tabular-nums leading-[1.15] text-white sm:text-4xl sm:font-bold">
          {totalHours.toFixed(1)}{' '}
          <span className="text-xs font-medium text-zinc-400 sm:text-sm">h</span>
        </p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-2xs leading-[1.4] tabular-nums text-zinc-400 sm:text-xs">
          <span className="font-medium text-zinc-300">
            {formatCurrency(totalEarnings.pln, 'PLN')}
          </span>
          {totalEarnings.eur > 0 && (
            <span>({formatCurrency(totalEarnings.eur, 'EUR')})</span>
          )}
          {/* Srednia w naglowku, a nie jako etykieta na linii odniesienia:
              tam napis lezal na samej linii i na slupkach. */}
          {avgHours > 0 && (
            <>
              <span aria-hidden className="text-zinc-600">·</span>
              <span>śr. {avgHours.toFixed(1)} h</span>
            </>
          )}
        </p>
      </div>

      {trend !== null && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold tabular-nums ring-1',
            trend > 0
              ? 'bg-[var(--chart-1)]/10 text-[var(--chart-1)] ring-[var(--chart-1)]/30'
              : trend < 0
                ? 'bg-destructive/10 text-destructive ring-destructive/30'
                : 'bg-surface-2 text-zinc-400 ring-hairline',
          )}
        >
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3" aria-hidden />
          ) : trend < 0 ? (
            <TrendingDown className="h-3 w-3" aria-hidden />
          ) : (
            <Minus className="h-3 w-3" aria-hidden />
          )}
          {trend > 0 ? '+' : ''}
          {trend.toFixed(1)}%
        </span>
      )}
    </div>
  )
}
