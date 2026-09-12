'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FileX } from 'lucide-react'
import { PageContainer } from '@/components/common/section/PageContainer'
import { LOCALE_LABELS, toAppLocale } from '@/i18n/config'
import { useFormat } from '@/lib/format/client'
import { cn } from '@/lib/utils'
import { rangeOf, type DateKey, type StatementClientRef } from '../domain'
import { useAccountingFilters } from '../hooks/useAccountingFilters'
import { useAccountingQuery } from '../hooks/useAccountingQuery'
import { useStatementExport } from '../hooks/useStatementExport'
import { useStatementModel } from '../hooks/useStatementModel'
import { StatementHeader } from './StatementHeader'
import { StatementSkeleton } from './StatementSkeleton'
import { StatementFilters } from './filters/StatementFilters'
import { StatementQuarters, StatementSummary } from './summary/StatementSummary'
import { StatementWarnings } from './summary/StatementWarnings'
import { StatementTable } from './table/StatementTable'
import { StatementEmptyState } from './shared/StatementEmptyState'

type Props = {
  /**
   * Dzisiejsza data wyliczona NA SERWERZE.
   *
   * Bez tego prefetch serwerowy i pierwsze zapytanie klienta moglyby wyliczyc
   * rozny zakres (roznica stref albo polnoc miedzy renderami), wiec hydracja
   * nie trafialaby w cache i wykaz pobieralby sie dwa razy. Ta sama data
   * rozstrzyga statusy faktur (SENT po terminie to OVERDUE).
   */
  today: DateKey
}

const NO_CLIENTS: StatementClientRef[] = []

export function StatementContent({ today }: Props) {
  const t = useTranslations('accounting')
  const uiLocale = toAppLocale(useLocale())
  const fmt = useFormat()

  const filtersState = useAccountingFilters(uiLocale)
  const { filters } = filtersState
  const query = useAccountingQuery(filters, today)
  const model = useStatementModel(query.data, today)
  const range = rangeOf(filters, today)

  // Stala referencja pustej listy: `?? []` w ciele komponentu tworzy nowa
  // tablice przy kazdym renderze i uniewaznia memo ponizej.
  const clients = query.data?.clients ?? NO_CLIENTS
  const clientName = useMemo(
    () => clients.find((client) => client.id === filters.clientId)?.name ?? null,
    [clients, filters.clientId],
  )

  const exports = useStatementExport({
    model,
    documentLocale: filters.documentLocale,
    clientName,
  })

  if (!model) return <StatementSkeleton />

  const rangeLabel = [
    filters.preset === 'custom' ? null : t(`period.${filters.preset}`),
    fmt.dateRange(range.start, range.end),
    clientName,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <PageContainer>
        <StatementHeader
          rangeLabel={rangeLabel}
          documentLocaleLabel={LOCALE_LABELS[filters.documentLocale].native}
          onExportPdf={exports.exportPdf}
          onExportCsv={exports.exportCsv}
          exportDisabled={model.rows.length === 0 || exports.isGenerating}
        />

        <StatementFilters
          filters={filters}
          range={range}
          clients={clients}
          activeCount={filtersState.activeCount}
          onPresetChange={filtersState.setPreset}
          onCustomRangeChange={filtersState.setCustomRange}
          onClientChange={filtersState.setClient}
          onDocumentLocaleChange={filtersState.setDocumentLocale}
          onReset={filtersState.reset}
        />

        {/* Odswiezanie po zmianie filtra przygasza wykaz zamiast go usuwac —
            skok do skeletonu przy kazdym klikniciu byl gorszy niz chwila
            nieaktualnych liczb. */}
        <div
          aria-busy={query.isFetching}
          className={cn(
            'space-y-5 transition-opacity',
            query.isFetching && 'pointer-events-none opacity-60',
          )}
        >
          <span aria-live="polite" className="sr-only">
            {query.isFetching ? t('filters.refreshing') : ''}
          </span>

          {model.rows.length === 0 ? (
            <StatementEmptyState
              icon={FileX}
              title={t('states.noInvoicesTitle')}
              description={t('states.noInvoicesDescription')}
            />
          ) : (
            <>
              <StatementWarnings model={model} />
              <StatementSummary model={model} />
              <StatementQuarters model={model} />
              <StatementTable model={model} />
            </>
          )}
        </div>
      </PageContainer>
    </div>
  )
}
