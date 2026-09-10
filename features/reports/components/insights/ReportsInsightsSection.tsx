'use client'

import { useTranslations } from 'next-intl'
import { Activity } from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { NO_DATA, type AppFormat } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { cn } from '@/lib/utils'
import type { ReportModel, WeekdayIndex } from '../../domain'
import { ReportCard } from '../shared/ReportCard'
import { ReportEmptyState } from '../shared/ReportEmptyState'

type Props = {
  model: ReportModel
}

/**
 * Tydzien odniesienia: 2024-01-01 to poniedzialek, wiec `01 + weekday` daje
 * date odpowiedniego dnia tygodnia. Sluzy WYLACZNIE do wyprodukowania nazwy
 * dnia w jezyku interfejsu — sama data nigdzie sie nie pokazuje.
 */
const MONDAY_REFERENCE_MONTH = '2024-01'

function weekdayName(fmt: AppFormat, weekday: WeekdayIndex): string {
  return fmt.weekday(`${MONDAY_REFERENCE_MONTH}-${String(1 + weekday).padStart(2, '0')}`, 'short')
}

/**
 * Rytm pracy: cztery liczby i rozklad tygodnia.
 *
 * Sekcja pokazuje WYLACZNIE to, co model danych naprawde wie. `WorkEntry` nie
 * ma godziny rozpoczecia ani zakonczenia pracy, wiec raport nie udaje, ze zna
 * pore dnia — to byloby zgadywanie podane jako fakt.
 */
export function ReportsInsightsSection({ model }: Props) {
  const t = useTranslations('reports')
  const fmt = useFormat()
  const { insights } = model

  if (model.kpis.entryCount === 0) {
    return (
      <ReportCard title={t('insights.title')} ariaLabel={t('insights.sectionLabel')}>
        <ReportEmptyState
          icon={Activity}
          title={t('insights.empty')}
          description={t('states.noMatchDescription')}
          className="mt-4"
        />
      </ReportCard>
    )
  }

  const peakHours = Math.max(...insights.weekdayLoad.map((slot) => slot.hours), 0)

  return (
    <ReportCard title={t('insights.title')} ariaLabel={t('insights.sectionLabel')}>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label={t('insights.busiestWeekday')}
          value={
            insights.busiestWeekday === null ? NO_DATA : weekdayName(fmt, insights.busiestWeekday)
          }
        />
        <Stat
          label={t('insights.longestStreak')}
          value={t('insights.longestStreakValue', { count: insights.longestStreakDays })}
        />
        <Stat
          label={t('insights.longestDay')}
          value={insights.longestDay ? fmt.hours(insights.longestDay.hours) : NO_DATA}
          meta={insights.longestDay ? fmt.date(insights.longestDay.date, 'dayMonth') : undefined}
        />
        <Stat
          label={t('insights.daysWithoutWork')}
          value={t('insights.daysWithoutWorkValue', { count: insights.daysWithoutWork })}
        />
      </dl>

      <section aria-label={t('insights.weekdayDistribution')} className="mt-5">
        <ul role="list" className="flex items-end justify-between gap-1.5 sm:gap-2">
          {insights.weekdayLoad.map((slot) => {
            const height = peakHours > 0 ? Math.max(4, (slot.hours / peakHours) * 100) : 4
            return (
              <li key={slot.weekday} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="sr-only">
                  {t('insights.weekdayHours', {
                    weekday: weekdayName(fmt, slot.weekday),
                    hours: fmt.hours(slot.hours),
                  })}
                </span>
                <div aria-hidden className="flex h-16 w-full items-end sm:h-20">
                  <div
                    className={cn(
                      'w-full rounded-t-md transition-[height]',
                      slot.weekday === insights.busiestWeekday ? 'bg-white' : 'bg-surface-3',
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span aria-hidden className="truncate text-2xs text-zinc-400">
                  {weekdayName(fmt, slot.weekday)}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </ReportCard>
  )
}

function Stat({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <div className="min-w-0">
      <SectionEyebrow as="dt" className="truncate">
        {label}
      </SectionEyebrow>
      <dd className="mt-1 truncate text-sm font-semibold tabular-nums text-white">{value}</dd>
      {meta && <p className="truncate text-2xs text-zinc-400">{meta}</p>}
    </div>
  )
}
