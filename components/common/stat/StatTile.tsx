import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type StatTileTone = 'neutral' | 'success' | 'warning' | 'action'
type StatTileAccent = 'brand' | 'warning' | 'info' | 'special'

type StatTileProps = {
  label: string
  value: string
  icon?: LucideIcon
  /** Wiersz pod wartością — druga waluta, licznik, kontekst. */
  secondary?: string
  /** Ostatni wiersz kafelka — opis albo porównanie. */
  meta?: string
  badge?: string
  tone?: StatTileTone
  /** 0–100; renderuje pasek postępu w kolorze `accent`. */
  progress?: number
  accent?: StatTileAccent
  /** Wartość tekstowa (np. nazwa klienta) — mniejszy stopień, żeby się mieściła. */
  compact?: boolean
  /** Znacznik zmiany względem poprzedniego okresu — stoi po prawej stronie `meta`. */
  trend?: ReactNode
}

const TONE_BADGE: Record<StatTileTone, string> = {
  neutral: 'bg-zinc-500/10 text-zinc-300 ring-1 ring-zinc-500/30',
  success: 'bg-positive-500/15 text-positive-300 ring-1 ring-positive-500/30',
  warning: 'bg-warning-500/15 text-warning-300 ring-1 ring-warning-500/30',
  action: 'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/30',
}

// Sam pasek niesie akcent. Wewnętrzne poświaty na obramowaniu (po jednej na
// każdy kafelek, w czterech różnych kolorach) dokładały się do wizualnego szumu.
const ACCENT_BAR: Record<StatTileAccent, string> = {
  brand: 'bg-brand-500',
  warning: 'bg-warning-500',
  info: 'bg-info-500',
  special: 'bg-special-500',
}

/**
 * Kafelek KPI sekcji — jeden dla całego panelu.
 *
 * Zastępuje `KpiTile` w Projektach, lokalny `KpiTile` w `ClientsStats`,
 * `InvoiceStatCard` w Fakturach (patrz `docs/ui-audit.md`) oraz
 * `ReportKpiCard` w Raportach. Ten ostatni różnił się WYŁĄCZNIE slotem na
 * znacznik zmiany — stąd `trend`, a nie czwarta implementacja pudełka.
 *
 * Skala wartości i traktowanie ikony idą z Raportów, bo to one są wzorcem
 * wizualnym panelu: mniejsza liczba mniej się ucina w dwukolumnowej siatce
 * na 390 px, a ikona bez ramki nie konkuruje z danymi. Padding `p-4 sm:p-5`
 * jest wspólny z `WorkspaceCard`, więc kafelek KPI i karta sekcji stojące
 * obok siebie mają ten sam rytm.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  secondary,
  meta,
  badge,
  tone = 'neutral',
  progress,
  accent = 'brand',
  compact,
  trend,
}: StatTileProps) {
  return (
    <div data-slot="stat-tile" className={cn(SURFACE.card, 'p-4 sm:p-5')}>
      <div className="flex items-start justify-between gap-2">
        {/* min-h na dwie linie — inaczej kafelek z zawiniętą etykietą jest
            wyższy od sąsiadów i siatka się rozjeżdża. */}
        <SectionEyebrow className="min-h-[2.4em] leading-[1.2]">{label}</SectionEyebrow>
        {Icon && <Icon aria-hidden className="size-4 shrink-0 text-zinc-400" />}
        {badge && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-2xs font-semibold tabular-nums',
              TONE_BADGE[tone],
            )}
          >
            {badge}
          </span>
        )}
      </div>

      <p
        className={cn(
          'mt-2 truncate font-semibold leading-none tracking-tight text-white',
          compact ? 'text-base leading-snug sm:text-lg' : 'text-2xl tabular-nums sm:text-3xl',
        )}
      >
        {value}
      </p>

      {secondary && (
        <p className="mt-0.5 truncate text-xs font-medium tabular-nums text-zinc-400">
          {secondary}
        </p>
      )}

      {progress !== undefined && (
        <div className={cn('mt-3 h-1 w-full overflow-hidden rounded-full', LINEAR.track)}>
          <div
            className={cn('h-full rounded-full transition-[width]', ACCENT_BAR[accent])}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            aria-hidden
          />
        </div>
      )}

      {(meta || trend) && (
        <div className="mt-2 flex items-center justify-between gap-2 text-2xs text-zinc-400 sm:text-xs">
          <span className="min-w-0 truncate">{meta ?? ' '}</span>
          {trend}
        </div>
      )}
    </div>
  )
}
