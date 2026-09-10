'use client'

import { Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import {
  DEMO_INVOICES,
  DEMO_PROJECTS,
  DEMO_RATE_EUR,
  DEMO_WEEK,
  DEMO_WEEKDAY_DATES,
  demoClient,
  type DemoMonth,
} from '../../demo/demo-data'
import { useDemoNames } from '../../demo/useDemoNames'
import { Bars, Card, Dot, Eyebrow, Meter, Pill, StatTile } from '../ui'

/** „Dzisiaj" w mockupie — jeden dzien odniesienia dla calej repliki Pulpitu. */
const TODAY = '2026-09-08'

/**
 * Pulpit — replika `features/dashboard`: kafle KPI, wykres zarobkow z
 * przelacznikiem zakresu, karta „Dzisiaj" z akcja glowna, lista projektow
 * i stan faktur. Te same sekcje, ta sama kolejnosc, te same etykiety —
 * w jezyku, w ktorym uzytkownik czyta landing.
 */
export function DashboardScreen({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.app.dashboard')
  const tInvoice = useTranslations('marketing.app.invoice.status')
  const fmt = useFormat()
  const names = useDemoNames()
  const weekEarnings = DEMO_WEEK.hours * DEMO_RATE_EUR

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="lp-t9 uppercase tracking-[0.14em] text-zinc-400">
        {t('dateline', {
          weekday: fmt.weekday(TODAY, 'long'),
          date: fmt.date(TODAY, 'dayMonth'),
          week: fmt.isoWeek(TODAY),
        })}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label={t('hours')}
          value={fmt.hours(DEMO_WEEK.hours)}
          meta={t('hoursMeta', { target: fmt.hours(DEMO_WEEK.hours), days: 6 })}
        />
        <StatTile
          label={t('earnings')}
          value={fmt.money(toMinor(weekEarnings), 'EUR')}
          meta={t('earningsMeta')}
          accent
        />
        {/* Ponizej `sm` ramka ma polowe wysokosci: lepiej pokazac dwa kafle
            w pelnym rozmiarze niz cztery przyciete. */}
        <StatTile
          className="hidden sm:block"
          label={t('effectiveRate')}
          value={fmt.money(toMinor(DEMO_RATE_EUR), 'EUR')}
          meta={t('perHour')}
        />
        <StatTile
          className="hidden sm:block"
          label={t('invoices')}
          value={fmt.number(3)}
          meta={t('invoicesMeta')}
        />
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Eyebrow>{t('earnings')}</Eyebrow>
          <div className="flex gap-0.5 rounded-md border border-[var(--lp-hair-2)] p-0.5">
            {(['week', 'month', 'year'] as const).map((range, index) => (
              <span
                key={range}
                className={`rounded px-1.5 py-0.5 lp-t8 ${
                  index === 0 ? 'bg-white/10 text-white' : 'text-zinc-400'
                }`}
              >
                {t(`ranges.${range}`)}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-1 text-lg font-semibold leading-none tabular-nums text-white">
          {fmt.money(toMinor(weekEarnings), 'EUR')}
        </p>
        <p className="lp-t9 text-zinc-400">
          {fmt.isoWeek(DEMO_WEEK.anchorDate)} · {fmt.dateRange(DEMO_WEEK.from, DEMO_WEEK.to)}
        </p>
        <Bars
          className="mt-2 max-h-[150px] min-h-[52px] flex-1"
          values={DEMO_WEEK.daily}
          labels={DEMO_WEEKDAY_DATES.map((date) => fmt.weekday(date, 'short'))}
          activeIndex={1}
        />
      </Card>

      {/* Na waskim ekranie ramka ma polowe wysokosci — zamiast sciskac oba
          bloki do nieczytelnosci, zostaje ten jeden. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        <Card>
          <Eyebrow>{t('currentProjects')}</Eyebrow>
          <ul className="mt-2 space-y-2">
            {DEMO_PROJECTS.map((project) => (
              <li key={project.id} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Dot color={demoClient(project.clientId).color} />
                  <span className="min-w-0 flex-1 truncate lp-t10 text-zinc-200">
                    {names.project(project.id)}
                  </span>
                  <span className="lp-mono lp-t9 tabular-nums text-zinc-400">
                    {fmt.hours(project.hours)}
                  </span>
                </div>
                <Meter
                  value={project.budgetUtilization}
                  tone={project.status === 'in_progress' ? 'accent' : 'neutral'}
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="hidden sm:block">
          <div className="flex items-center justify-between">
            <Eyebrow>{t('invoices')}</Eyebrow>
            <span className="lp-t9 tabular-nums text-zinc-400">
              {t('toInvoice', { amount: fmt.money(toMinor(month.earningsEur), 'EUR') })}
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {DEMO_INVOICES.map((invoice) => (
              <li key={invoice.number} className="flex items-center gap-2">
                <span className="lp-mono lp-t9 text-zinc-300">{invoice.number}</span>
                <Pill tone={invoice.status === 'paid' ? 'accent' : 'mute'}>
                  {tInvoice(invoice.status)}
                </Pill>
                <span className="lp-mono ml-auto lp-t9 tabular-nums text-zinc-200">
                  {fmt.money(toMinor(invoice.amountEur), 'EUR')}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--lp-hair)] pt-2.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--lp-accent)] px-2 py-1 lp-t9 font-semibold text-black">
              {t('addToday', { hours: fmt.hours(10) })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--lp-hair-2)] px-2 py-1 lp-t9 text-zinc-300">
              <Play className="size-2 fill-current" />
              {t('startTimer')}
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
