'use client'

import { useTranslations } from 'next-intl'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import {
  DEMO_AUTOMATION_TARGET,
  DEMO_MONTH,
  demoClient,
  type DemoMonth,
} from '../../demo/demo-data'
import { MonthGrid } from '../MonthGrid'
import { Card, Eyebrow, StatTile } from '../ui'

/** Statusy wpisu — komplet z `features/calendar/domain/calendar.constants`. */
const STATUS_LEGEND = [
  { key: 'worked', color: 'oklch(0.65 0.20 160)' },
  { key: 'notWorked', color: 'oklch(0.60 0.22 27)' },
  { key: 'vacation', color: 'oklch(0.60 0.18 310)' },
  { key: 'sick', color: 'oklch(0.75 0.17 80)' },
  { key: 'dayOff', color: 'oklch(0.65 0 0)' },
] as const

/**
 * Kalendarz — replika `features/calendar`: pasek nawigacji miesiaca, karty
 * KPI, siatka dni i legenda statusow. Miesiac jest ten sam, ktory automat
 * wypelnia nizej na stronie.
 */
export function CalendarScreen({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.app.calendar')
  const fmt = useFormat()
  const client = demoClient(DEMO_AUTOMATION_TARGET.clientId)
  const monthLabel = fmt.monthTitle(DEMO_MONTH.iso)

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="lp-t11 font-semibold text-white">{monthLabel}</span>
          <span className="flex gap-0.5">
            <span className="flex size-4 items-center justify-center rounded border border-[var(--lp-hair-2)] lp-t8 text-zinc-400">
              ‹
            </span>
            <span className="flex size-4 items-center justify-center rounded border border-[var(--lp-hair-2)] lp-t8 text-zinc-400">
              ›
            </span>
          </span>
        </div>
        <div className="flex gap-0.5 rounded-md border border-[var(--lp-hair-2)] p-0.5">
          {(['grid', 'list'] as const).map((view, index) => (
            <span
              key={view}
              className={`rounded px-1.5 py-0.5 lp-t8 ${
                index === 0 ? 'bg-white/10 text-white' : 'text-zinc-400'
              }`}
            >
              {t(`views.${view}`)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label={t('hours')} value={fmt.hours(month.totalHours)} meta={monthLabel} />
        <StatTile
          label={t('workedDays')}
          value={fmt.number(month.workedDays)}
          meta={t('workedDaysMeta')}
        />
        <StatTile
          label={t('earnings')}
          value={fmt.money(toMinor(month.earningsEur), 'EUR')}
          meta={client.name}
          accent
        />
        <StatTile
          label={t('streak')}
          value={t('streakValue', { days: 6 })}
          meta={t('streakMeta')}
        />
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          {/* Bez `progress`: kalendarz pokazuje miesiac GOTOWY. Wczesniej
              stala jedynka przechodzila przez szescdziesiat `useTransform`,
              ktore nigdy nie mialy sie zmienic. */}
          <MonthGrid days={month.days} clientColor={client.color} today={8} fill />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[var(--lp-hair)] pt-2">
          <Eyebrow>{t('statusesTitle')}</Eyebrow>
          {STATUS_LEGEND.map((status) => (
            <span key={status.key} className="flex items-center gap-1 lp-t8 text-zinc-400">
              <span className="size-1.5 rounded-full" style={{ background: status.color }} />
              {t(`statuses.${status.key}`)}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}
