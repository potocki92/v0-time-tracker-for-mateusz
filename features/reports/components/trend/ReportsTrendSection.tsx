'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { LineChart } from 'lucide-react'
import { SkeletonBlock } from '@/components/common/SkeletonBlock'
import { useFormat } from '@/lib/format/client'
import type { ReportModel } from '../../domain'
import { ReportCard } from '../shared/ReportCard'
import { ReportEmptyState } from '../shared/ReportEmptyState'
import { SegmentedControl } from '../shared/SegmentedControl'
import { formatMetricValue, toChartPoints, type TrendMetric } from './trendView'

/**
 * Recharts jedzie osobnym chunkiem.
 *
 * To najciezsza zaleznosc raportu, a wykres stoi ponizej KPI — bez tego
 * `dynamic` kazde wejscie na `/reports` (takze po to, zeby zerknac na godziny)
 * pobieraloby cala biblioteke wykresow. `ssr: false`, bo Recharts i tak mierzy
 * kontener dopiero w przegladarce.
 */
const ReportsTrendChart = dynamic(
  () => import('./ReportsTrendChart').then((mod) => mod.ReportsTrendChart),
  { ssr: false, loading: () => <SkeletonBlock height={224} rounded="lg" className="mt-4" /> },
)

type Props = {
  model: ReportModel
}

export function ReportsTrendSection({ model }: Props) {
  const t = useTranslations('reports')
  const fmt = useFormat()
  const [metric, setMetric] = useState<TrendMetric>('hours')

  const compare = model.comparison !== null
  const metricLabel = metric === 'hours' ? t('trend.metricHours') : t('trend.metricValue')
  const unitLabel = t(`trend.unit${model.trend.unit === 'day' ? 'Day' : model.trend.unit === 'week' ? 'Week' : 'Month'}`)

  const description = t('trend.summary', {
    metric: metricLabel.toLocaleLowerCase(fmt.locale),
    unit: unitLabel,
    from: fmt.date(model.range.start, 'long'),
    to: fmt.date(model.range.end, 'long'),
  })

  // Ta sama lista, ktora widzi czytnik ekranu — wykres nie moze byc jedynym
  // sposobem poznania wartosci.
  const points = useMemo(() => toChartPoints(model.trend, metric, fmt), [model.trend, metric, fmt])
  const hasData = model.kpis.entryCount > 0

  return (
    <ReportCard
      title={t('trend.title')}
      ariaLabel={t('trend.sectionLabel')}
      action={
        <SegmentedControl
          ariaLabel={t('trend.metricSwitcher')}
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'hours', label: t('trend.metricHours') },
            { value: 'value', label: t('trend.metricValue') },
          ]}
        />
      }
    >
      {hasData ? (
        <>
          <ReportsTrendChart
            trend={model.trend}
            metric={metric}
            currency={model.currency}
            compare={compare}
            description={description}
          />
          <table className="sr-only">
            <caption>{t('trend.tableFallback')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('table.date')}</th>
                <th scope="col">{metricLabel}</th>
                {compare && <th scope="col">{t('trend.previousSeries')}</th>}
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.key}>
                  <th scope="row">{point.rangeLabel}</th>
                  <td>{formatMetricValue(fmt, metric, point.current, model.currency)}</td>
                  {compare && (
                    <td>
                      {formatMetricValue(fmt, metric, point.previous ?? 0, model.currency)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <ReportEmptyState
          icon={LineChart}
          title={t('trend.empty')}
          description={t('states.noMatchDescription')}
          className="mt-4"
        />
      )}
    </ReportCard>
  )
}
