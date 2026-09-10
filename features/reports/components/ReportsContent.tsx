'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarRange, SearchX } from 'lucide-react'
import { PageContainer } from '@/components/common/section/PageContainer'
import { useFormat } from '@/lib/format/client'
import { cn } from '@/lib/utils'
import {
  ALL,
  projectAfterClientChange,
  rangeOf,
  type DateKey,
  type ReportClientRef,
  type ReportProjectRef,
} from '../domain'
import { useReportModel } from '../hooks/useReportModel'
import { useReportsExport } from '../hooks/useReportsExport'
import { useReportsFilters } from '../hooks/useReportsFilters'
import { useReportsQuery } from '../hooks/useReportsQuery'
import { ReportsHeader } from './ReportsHeader'
import { ReportsSkeleton } from './ReportsSkeleton'
import { ReportsFilters } from './filters/ReportsFilters'
import { ReportsKpis } from './kpi/ReportsKpis'
import { ReportsBreakdownSection } from './breakdown/ReportsBreakdownSection'
import { ReportsHeatmapSection } from './insights/ReportsHeatmapSection'
import { ReportsInsightsSection } from './insights/ReportsInsightsSection'
import { ReportsDetailSection } from './table/ReportsDetailSection'
import { ReportsTrendSection } from './trend/ReportsTrendSection'
import { ReportEmptyState } from './shared/ReportEmptyState'

type Props = {
  /**
   * Dzisiejsza data wyliczona NA SERWERZE.
   *
   * Bez tego prefetch serwerowy i pierwsze zapytanie klienta moglyby wyliczyc
   * rozny zakres (roznica stref albo polnoc miedzy renderami), wiec hydracja
   * nie trafialaby w cache i raport pobieralby sie dwa razy.
   */
  today: DateKey
}

/** Ponizej tylu wpisow srednie i trendy sa bardziej myloce niz pomocne. */
const THIN_DATA_THRESHOLD = 3

const NO_PROJECTS: ReportProjectRef[] = []
const NO_CLIENTS: ReportClientRef[] = []

export function ReportsContent({ today }: Props) {
  const t = useTranslations('reports')
  const fmt = useFormat()

  const filtersState = useReportsFilters()
  const { filters } = filtersState
  const query = useReportsQuery(filters, today)
  // Stala referencja pustej listy: `?? []` w ciele komponentu tworzy nowa
  // tablice przy kazdym renderze i uniewaznia memo ponizej.
  const projects = query.data?.projects ?? NO_PROJECTS
  const model = useReportModel(query.data, filters, today)
  const range = rangeOf(filters, today)

  const clientName = useMemo(
    () => query.data?.clients.find((client) => client.id === filters.clientId)?.name ?? null,
    [query.data, filters.clientId],
  )
  const projectName = useMemo(
    () => projects.find((project) => project.id === filters.projectId)?.name ?? null,
    [projects, filters.projectId],
  )

  // Opis filtrow trafia do naglowka PDF — sklada go UI, bo tylko ono zna
  // i nazwy (dane uzytkownika), i tlumaczenia etykiet.
  const filtersSummary = [
    t(`period.${filters.preset}`),
    clientName,
    projectName,
    filters.tag !== ALL ? filters.tag : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const exports = useReportsExport({ model, filtersSummary })

  if (!model) return <ReportsSkeleton />

  const rangeLabel =
    filters.preset === 'custom'
      ? fmt.dateRange(range.start, range.end)
      : `${t(`period.${filters.preset}`)} · ${fmt.dateRange(range.start, range.end)}`

  const compareLabel = model.comparison
    ? t('compare.rangeLabel', {
        from: fmt.date(model.comparison.previousRange.start, 'short'),
        to: fmt.date(model.comparison.previousRange.end, 'short'),
      })
    : null

  const hasRows = model.kpis.entryCount > 0

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <PageContainer>
        <ReportsHeader
          rangeLabel={rangeLabel}
          compareLabel={compareLabel}
          onExportCsv={exports.exportCsv}
          onExportJson={exports.exportJson}
          onExportPdf={exports.exportPdf}
          onExportWorksiteCsv={exports.exportWorksiteCsv}
          onExportWorksitePdf={exports.exportWorksitePdf}
          exportDisabled={!hasRows || exports.isGeneratingPdf}
        />

        <ReportsFilters
          filters={filters}
          range={range}
          clients={query.data?.clients ?? NO_CLIENTS}
          projects={projects}
          tags={model.availableTags}
          activeCount={filtersState.activeCount}
          onPresetChange={filtersState.setPreset}
          onCustomRangeChange={filtersState.setCustomRange}
          onClientChange={(clientId) =>
            filtersState.setClient(
              clientId,
              projectAfterClientChange(projects, clientId, filters.projectId),
            )
          }
          onProjectChange={filtersState.setProjectId}
          onTagChange={filtersState.setTag}
          onToggleCompare={filtersState.toggleCompare}
          onReset={filtersState.reset}
        />

        {/* Odswiezanie po zmianie filtra przygasza raport zamiast go usuwac —
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

          {model.datasetIsEmpty ? (
            <ReportEmptyState
              icon={CalendarRange}
              title={t('states.noEntriesTitle')}
              description={t('states.noEntriesDescription')}
            />
          ) : !hasRows ? (
            <ReportEmptyState
              icon={SearchX}
              title={t('states.noMatchTitle')}
              description={t('states.noMatchDescription')}
            />
          ) : (
            <>
              <ReportsKpis model={model} />

              {model.kpis.entryCount <= THIN_DATA_THRESHOLD && (
                <p className="text-2xs text-zinc-400">{t('states.thinDataNote')}</p>
              )}

              <ReportsTrendSection model={model} />
              <ReportsBreakdownSection model={model} />
              <ReportsInsightsSection model={model} />
              {model.heatmap && <ReportsHeatmapSection days={model.heatmap} />}
              <ReportsDetailSection model={model} />
            </>
          )}
        </div>
      </PageContainer>
    </div>
  )
}
