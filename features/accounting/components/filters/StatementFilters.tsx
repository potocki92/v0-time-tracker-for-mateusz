'use client'

import { useTranslations } from 'next-intl'
import { APP_LOCALES, LOCALE_LABELS, type AppLocale } from '@/i18n/config'
import {
  WORKSPACE_FIELD,
  WORKSPACE_FIELD_LABEL,
  WorkspaceFilters,
  WorkspaceSegmentedControl,
} from '@/components/workspace'
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

/**
 * Pasek filtrow wykazu.
 *
 * Trzy pytania, w kolejnosci, w ktorej sie je zadaje: za jaki OKRES, dla
 * ktorego KLIENTA i w jakim JEZYKU ma byc plik. Jezyk dokumentu stoi tu,
 * a nie w ustawieniach konta, bo zmienia sie razem z odbiorca pliku —
 * ta sama osoba wysyla wykaz niemieckiej ksiegowej i polskiemu urzedowi.
 *
 * Pasek idzie przez `WorkspaceFilters`, wiec na telefonie otwiera sie tak
 * samo jak filtry Raportow czy Klientow, a na desktopie zostaje inline.
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

  /**
   * Jezyk dokumentu stoi w filtrach, a nie w ustawieniach konta, bo zmienia
   * sie razem z odbiorca pliku — ta sama osoba wysyla wykaz niemieckiej
   * ksiegowej i polskiemu urzedowi.
   */
  // Renderowany raz, wewnatrz pol filtra — na telefonie trafia do arkusza,
  // na desktopie do wersji inline. Kopia w stopce paska dublowalaby kontrolke
  // sterujaca tym samym stanem.
  const languageGroup = (
    <div className="space-y-2">
      <span aria-hidden className={WORKSPACE_FIELD_LABEL}>
        {t('filters.documentLocale')}
      </span>
      <WorkspaceSegmentedControl
        ariaLabel={t('filters.documentLocale')}
        value={filters.documentLocale}
        options={APP_LOCALES.map((locale) => ({
          value: locale,
          label: LOCALE_LABELS[locale].native,
        }))}
        onChange={onDocumentLocaleChange}
        className="flex"
      />
    </div>
  )

  return (
    <WorkspaceFilters
      sectionLabel={t('filters.sectionLabel')}
      title={t('filters.sectionLabel')}
      description={t('filters.documentLocaleHint')}
      activeCount={activeCount}
      onReset={onReset}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="statement-preset" className={WORKSPACE_FIELD_LABEL}>
              {t('period.label')}
            </label>
            <select
              id="statement-preset"
              value={filters.preset}
              onChange={(event) => onPresetChange(event.target.value as StatementPeriodPreset)}
              className={WORKSPACE_FIELD}
            >
              {STATEMENT_PERIOD_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {t(`period.${preset}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="statement-client" className={WORKSPACE_FIELD_LABEL}>
              {t('filters.client')}
            </label>
            <select
              id="statement-client"
              value={filters.clientId}
              onChange={(event) => onClientChange(event.target.value)}
              className={WORKSPACE_FIELD}
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
                <label htmlFor="statement-from" className={WORKSPACE_FIELD_LABEL}>
                  {t('period.from')}
                </label>
                <input
                  id="statement-from"
                  type="date"
                  value={range.start}
                  max={range.end}
                  onChange={(event) => onCustomRangeChange(event.target.value, range.end)}
                  className={WORKSPACE_FIELD}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="statement-to" className={WORKSPACE_FIELD_LABEL}>
                  {t('period.to')}
                </label>
                <input
                  id="statement-to"
                  type="date"
                  value={range.end}
                  min={range.start}
                  onChange={(event) => onCustomRangeChange(range.start, event.target.value)}
                  className={WORKSPACE_FIELD}
                />
              </div>
            </>
          )}
        </div>

        {languageGroup}
      </div>
    </WorkspaceFilters>
  )
}
