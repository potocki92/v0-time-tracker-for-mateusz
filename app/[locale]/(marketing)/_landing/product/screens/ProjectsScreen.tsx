'use client'

import { useTranslations } from 'next-intl'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import { DEMO_CLIENTS, DEMO_PROJECTS, demoClient } from '../../demo/demo-data'
import { useDemoNames } from '../../demo/useDemoNames'
import { Card, Dot, Eyebrow, Meter, Pill, StatTile } from '../ui'

/**
 * Projekty + Klienci — replika `features/projects` (wiersz z szyna statusu,
 * godziny, wykorzystanie budzetu, termin) i `features/clients` (tabela ze
 * stawka, typem rozliczenia i waluta).
 *
 * Dwa ekrany w jednej scenie, bo to jeden model danych: klient niesie
 * stawke, projekt niesie godziny.
 */
export function ProjectsScreen() {
  const t = useTranslations('marketing.app.projects')
  const tCommon = useTranslations('common')
  const fmt = useFormat()
  const names = useDemoNames()

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label={t('all')} value={fmt.number(3)} meta={t('allMeta')} />
        <StatTile
          label={t('inProgress')}
          value={fmt.number(1)}
          meta={t('shareOfTotal', { percent: fmt.percent(1 / 3) })}
          accent
        />
        <StatTile
          label={t('completed')}
          value={fmt.number(1)}
          meta={t('shareOfTotal', { percent: fmt.percent(1 / 3) })}
        />
        <StatTile label={t('clients')} value={fmt.number(3)} meta={t('clientsMeta')} />
      </div>

      <Card className="min-h-0 flex-1">
        <Eyebrow>{t('allProjects')}</Eyebrow>
        <ul className="mt-2 space-y-1.5">
          {DEMO_PROJECTS.map((project) => {
            const client = demoClient(project.clientId)
            const active = project.status === 'in_progress'
            return (
              <li
                key={project.id}
                className="relative overflow-hidden rounded-lg border border-[var(--lp-hair-2)] bg-[var(--lp-s3)] py-2 pl-3 pr-2"
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-[3px] ${
                    active ? 'bg-[var(--lp-accent)]' : 'bg-white/15'
                  }`}
                />
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate lp-t10 font-medium text-white">
                    {names.project(project.id)}
                  </span>
                  <Pill tone={active ? 'accent' : 'mute'}>{t(`status.${project.status}`)}</Pill>
                </div>
                <div className="mt-1 flex items-center gap-2 lp-t9 text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Dot color={client.color} />
                    {names.client(client.id)}
                  </span>
                  <span className="lp-mono tabular-nums">{fmt.hours(project.hours)}</span>
                  <span className="lp-mono tabular-nums">
                    {t('budget', { percent: fmt.percent(project.budgetUtilization / 100) })}
                  </span>
                  <span className="ml-auto">{fmt.date(project.dueDate, 'dayMonth')}</span>
                </div>
                <div className="mt-1.5">
                  <Meter value={project.budgetUtilization} tone={active ? 'accent' : 'neutral'} />
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="hidden sm:block">
        <Eyebrow>{t('clients')}</Eyebrow>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left lp-t8 uppercase tracking-wide text-zinc-400">
              <th className="pb-1 font-medium">{t('table.name')}</th>
              <th className="pb-1 font-medium">{t('table.billing')}</th>
              <th className="pb-1 text-right font-medium">{t('table.rate')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--lp-hair)]">
            {DEMO_CLIENTS.map((client) => (
              <tr key={client.id} className="lp-t9 text-zinc-300">
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <Dot color={client.color} />
                    {names.client(client.id)}
                  </span>
                </td>
                <td className="py-1.5 text-zinc-400">{t(`billing.${client.workType}`)}</td>
                <td className="lp-mono py-1.5 text-right tabular-nums">
                  {fmt.money(toMinor(client.rate), 'EUR')} /{' '}
                  {client.workType === 'hourly'
                    ? tCommon('units.hoursShort')
                    : tCommon('units.pieceShort')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
