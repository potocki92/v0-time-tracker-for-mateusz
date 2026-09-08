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
 * Kafelek KPI sekcji. Zastępuje trzy implementacje tego samego pudełka:
 * `KpiTile` w Projektach, lokalny `KpiTile` w `ClientsStats` i `InvoiceStatCard`
 * w Fakturach — patrz `docs/ui-audit.md`.
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
}: StatTileProps) {
  return (
    <div data-slot="stat-tile" className={cn(SURFACE.card, 'p-3.5 sm:p-4')}>
      <div className="flex items-start justify-between gap-2">
        {/* min-h na dwie linie — inaczej kafelek z zawiniętą etykietą jest
            wyższy od sąsiadów i siatka się rozjeżdża. */}
        <SectionEyebrow className="min-h-[2.4em] leading-[1.2]">{label}</SectionEyebrow>
        {Icon && (
          <span
            className={cn(
              'shrink-0 rounded-md border p-1 text-zinc-300',
              LINEAR.border,
              LINEAR.surfaceElevated,
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
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

      {/* Stały rozmiar zamiast płynnego `text-2xl` (clamp do 3rem w globals.css),
          przez który kwoty ucinały się w dwukolumnowej siatce na telefonie. */}
      <p
        className={cn(
          'mt-2 truncate font-semibold leading-none tracking-tight text-white',
          compact ? 'text-base leading-snug sm:text-lg' : 'text-3xl tabular-nums sm:text-4xl',
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

      {meta && <p className="mt-2 truncate text-2xs text-zinc-400 sm:text-xs">{meta}</p>}
    </div>
  )
}
