'use client'

import { useTranslations } from 'next-intl'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import {
  DEMO_MONTH,
  DEMO_MONTHLY_HOURS,
  DEMO_PROJECTS,
  DEMO_RATE_EUR,
  demoClient,
  type DemoMonth,
} from '../../demo/demo-data'
import { useDemoNames } from '../../demo/useDemoNames'
import { Bars, Card, Dot, Eyebrow, Meter, StatTile } from '../ui'

/**
 * Raporty — replika `features/reports`: filtry zakresu, kafle KPI z
 * porownaniem okresu, wykres godzin i podzial na projekty z udzialem
 * procentowym. Eksport CSV / PDF stoi w naglowku, bo istnieje w produkcie
 * (`features/reports/hooks/useReportsExport`).
 */
export function ReportsScreen({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.app.reports')
  const fmt = useFormat()
  const names = useDemoNames()
  const totalProjectHours = DEMO_PROJECTS.reduce((sum, project) => sum + project.hours, 0)

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 rounded-md border border-[var(--lp-hair-2)] p-0.5">
          {(['d7', 'd30', 'd90'] as const).map((range, index) => (
            <span
              key={range}
              className={`rounded px-1.5 py-0.5 lp-t8 ${
                index === 1 ? 'bg-white/10 text-white' : 'text-zinc-400'
              }`}
            >
              {t(`ranges.${range}`)}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="rounded-md border border-[var(--lp-hair-2)] px-1.5 py-0.5 lp-t8 text-zinc-400">
            {t('exportCsv')}
          </span>
          <span className="rounded-md border border-[var(--lp-hair-2)] px-1.5 py-0.5 lp-t8 text-zinc-400">
            {t('pdf')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label={t('hours')}
          value={fmt.hours(month.totalHours)}
          meta={fmt.monthTitle(DEMO_MONTH.iso)}
        />
        <StatTile
          label={t('revenue')}
          value={fmt.money(toMinor(month.earningsEur), 'EUR')}
          meta={t('revenueMeta')}
          accent
        />
        <StatTile
          className="hidden sm:block"
          label={t('avgPerDay')}
          value={fmt.hours(month.totalHours / Math.max(1, month.workedDays), { decimals: 1 })}
          meta={t('workingDays', { days: month.workedDays })}
        />
        <StatTile
          className="hidden sm:block"
          label={t('rate')}
          value={fmt.money(toMinor(DEMO_RATE_EUR), 'EUR')}
          meta={t('perHour')}
        />
      </div>

      <Card className="flex max-h-[200px] min-h-0 flex-1 flex-col">
        <Eyebrow>{t('monthlyHours')}</Eyebrow>
        <Bars
          className="mt-2 min-h-[64px] flex-1"
          values={DEMO_MONTHLY_HOURS.map((entry) => entry.hours)}
          labels={DEMO_MONTHLY_HOURS.map((entry) => fmt.monthName(entry.month, 'short'))}
          activeIndex={DEMO_MONTHLY_HOURS.length - 1}
        />
      </Card>

      <Card className="hidden min-h-0 flex-1 sm:block">
        <Eyebrow>{t('byProject')}</Eyebrow>
        <ul className="mt-2 space-y-2">
          {DEMO_PROJECTS.filter((project) => project.hours > 0).map((project) => {
            const share = project.hours / totalProjectHours
            return (
              <li key={project.id} className="space-y-1">
                <div className="flex items-center gap-1.5 lp-t9">
                  <Dot color={demoClient(project.clientId).color} />
                  <span className="min-w-0 flex-1 truncate text-zinc-200">{names.project(project.id)}</span>
                  <span className="lp-mono tabular-nums text-zinc-300">
                    {fmt.hours(project.hours)}
                  </span>
                  <span className="lp-mono w-8 text-right tabular-nums text-zinc-400">
                    {fmt.percent(share)}
                  </span>
                </div>
                <Meter value={share * 100} />
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
