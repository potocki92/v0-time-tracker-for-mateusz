'use client'

import { useTranslations } from 'next-intl'
import { APP_LOCALES, LOCALE_LABELS, type AppLocale } from '@/i18n/config'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import {
  ALL,
  STATEMENT_PERIOD_PRESETS,
  type DateKey,
  type StatementClientRef,
  type StatementFilters as Filters,
  type StatementPeriodPreset,
  type StatementRange,
} from '../../domain'

type Props = {
  filters: Filters
  range: StatementRange
  clients: StatementClientRef[]
  activeCount: number
  onPresetChange: (preset: StatementPeriodPreset) => void
  onCustomRangeChange: (from: DateKey, to: DateKey) => void
  onClientChange: (clientId: string) => void
  onDocumentLocaleChange: (locale: AppLocale) => void
  onReset: () => void
}

const FIELD_CLASSES = cn(
  'h-11 w-full rounded-xl border px-3 text-sm text-zinc-200',
  LINEAR.border,
  LINEAR.surface,
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
)

/**
 * Pasek filtrow wykazu.
 *
 * Trzy pytania, w kolejnosci, w ktorej sie je zadaje: za jaki OKRES, dla
 * ktorego KLIENTA i w jakim JEZYKU ma byc plik. Jezyk dokumentu stoi tu,
 * a nie w ustawieniach konta, bo zmienia sie razem z odbiorca pliku —
 * ta sama osoba wysyla wykaz niemieckiej ksiegowej i polskiemu urzedowi.
 *
 * Bez arkusza mobilnego: cztery pola miesci sie w jednej kolumnie takze
 * na 375 px, wiec dodatkowa warstwa nic by nie wnosila.
 */
export function StatementFilters({
  filters,
  range,
  clients,
  activeCount,
  onPresetChange,
  onCustomRangeChange,
  onClientChange,
  onDocumentLocaleChange,
  onReset,
}: Props) {
  const t = useTranslations('accounting')

  return (
    <section
      aria-label={t('filters.sectionLabel')}
      className={cn(SURFACE.card, 'space-y-4 p-3 sm:p-4')}
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label htmlFor="statement-preset" className={LINEAR.eyebrow}>
            {t('period.label')}
          </label>
          <select
            id="statement-preset"
            value={filters.preset}
            onChange={(event) => onPresetChange(event.target.value as StatementPeriodPreset)}
            className={FIELD_CLASSES}
          >
            {STATEMENT_PERIOD_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {t(`period.${preset}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="statement-client" className={LINEAR.eyebrow}>
            {t('filters.client')}
          </label>
          <select
            id="statement-client"
            value={filters.clientId}
            onChange={(event) => onClientChange(event.target.value)}
            className={FIELD_CLASSES}
          >
            <option value={ALL}>{t('filters.allClients')}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {filters.preset === 'custom' && (
          <>
            <div className="space-y-2">
              <label htmlFor="statement-from" className={LINEAR.eyebrow}>
                {t('period.from')}
              </label>
              <input
                id="statement-from"
                type="date"
                value={range.start}
                max={range.end}
                onChange={(event) => onCustomRangeChange(event.target.value, range.end)}
                className={FIELD_CLASSES}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="statement-to" className={LINEAR.eyebrow}>
                {t('period.to')}
              </label>
              <input
                id="statement-to"
                type="date"
                value={range.end}
                min={range.start}
                onChange={(event) => onCustomRangeChange(range.start, event.target.value)}
                className={FIELD_CLASSES}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-hairline pt-4">
        <div className="space-y-2">
          <span id="statement-language-label" className={LINEAR.eyebrow}>
            {t('filters.documentLocale')}
          </span>
          <div
            role="group"
            aria-labelledby="statement-language-label"
            className={cn('flex gap-1 rounded-xl border p-1', LINEAR.border, LINEAR.surface)}
          >
            {APP_LOCALES.map((locale) => {
              const active = locale === filters.documentLocale
              return (
                <button
                  key={locale}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onDocumentLocaleChange(locale)}
                  className={cn(
                    'h-9 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
                    active
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:bg-surface-3 hover:text-zinc-200',
                  )}
                >
                  {LOCALE_LABELS[locale].native}
                </button>
              )
            })}
          </div>
          <p className="text-2xs text-zinc-400">{t('filters.documentLocaleHint')}</p>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={activeCount === 0}
          className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-300 disabled:opacity-40"
        >
          {t('filters.reset')}
        </button>
      </div>
    </section>
  )
}
