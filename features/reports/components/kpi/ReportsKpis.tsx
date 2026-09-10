'use client'

import { useTranslations } from 'next-intl'
import { CalendarCheck, Clock4, Coins, Gauge, Percent, Sigma } from 'lucide-react'
import { NO_DATA } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import type { ComparableMetric, ReportModel } from '../../domain'
import { ReportKpiCard } from './ReportKpiCard'
import { TrendBadge } from './TrendBadge'

type Props = {
  model: ReportModel
}

/**
 * Szesc wskaznikow, ktore odpowiadaja na pytania uzytkownika: ile pracowalem,
 * ile to warte, jak czesto i jak gesto pracowalem, ile realnie zarabiam
 * na godzinie i jaka czesc pracy jest rozliczana.
 *
 * Kafelek pokazuje znacznik zmiany TYLKO gdy wlaczono porownanie — bez tego
 * badge bylby ozdoba bez danych.
 */
export function ReportsKpis({ model }: Props) {
  const t = useTranslations('reports')
  const fmt = useFormat()
  const { kpis, comparison } = model

  const trendOf = (metric: ComparableMetric, absoluteLabel?: string) =>
    comparison ? (
      <TrendBadge delta={comparison.deltas[metric]} absoluteLabel={absoluteLabel} />
    ) : undefined

  const previousHint = (value: string) => t('compare.previous', { value })

  return (
    <section
      aria-label={t('kpi.sectionLabel')}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
    >
      <ReportKpiCard
        icon={Sigma}
        label={t('kpi.totalHours.label')}
        value={fmt.hours(kpis.totalHours)}
        hint={
          comparison
            ? previousHint(fmt.hours(comparison.previousKpis.totalHours))
            : t('kpi.totalHours.hint', { count: kpis.entryCount })
        }
        trend={trendOf('totalHours')}
      />

      <ReportKpiCard
        icon={Coins}
        label={t('kpi.workValue.label')}
        value={fmt.money(kpis.workValueMinor, model.currency)}
        hint={
          comparison
            ? previousHint(fmt.moneyCompact(comparison.previousKpis.workValueMinor, model.currency))
            : t('kpi.workValue.hint')
        }
        trend={trendOf('workValue')}
      />

      <ReportKpiCard
        icon={CalendarCheck}
        label={t('kpi.activeDays.label')}
        value={fmt.number(kpis.activeDays)}
        hint={
          comparison
            ? previousHint(fmt.number(comparison.previousKpis.activeDays))
            : t('kpi.activeDays.hint', { count: model.spanDays })
        }
        trend={trendOf('activeDays')}
      />

      <ReportKpiCard
        icon={Clock4}
        label={t('kpi.avgPerActiveDay.label')}
        value={fmt.hours(kpis.avgHoursPerActiveDay, { decimals: 1 })}
        hint={
          comparison
            ? previousHint(fmt.hours(comparison.previousKpis.avgHoursPerActiveDay, { decimals: 1 }))
            : t('kpi.avgPerActiveDay.hint')
        }
        trend={trendOf('avgHoursPerActiveDay')}
      />

      <ReportKpiCard
        icon={Gauge}
        label={t('kpi.effectiveRate.label')}
        value={fmt.rate(kpis.effectiveHourlyRateMinor, model.currency)}
        hint={
          comparison
            ? previousHint(
                fmt.rate(comparison.previousKpis.effectiveHourlyRateMinor, model.currency),
              )
            : t('kpi.effectiveRate.hint')
        }
        trend={trendOf('effectiveHourlyRate')}
      />

      <ReportKpiCard
        icon={Percent}
        label={t('kpi.billable.label')}
        value={kpis.billableRatio === null ? NO_DATA : fmt.percent(kpis.billableRatio)}
        hint={
          comparison
            ? previousHint(
                comparison.previousKpis.billableRatio === null
                  ? NO_DATA
                  : fmt.percent(comparison.previousKpis.billableRatio),
              )
            : t('kpi.billable.hint')
        }
        trend={trendOf('billableRatio')}
      />
    </section>
  )
}
