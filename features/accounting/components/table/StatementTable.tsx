'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, ListX, MapPin } from 'lucide-react'
import { useFormat } from '@/lib/format/client'
import type { AppFormat } from '@/lib/format'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import { formatPartyAddress, type StatementModel, type StatementRow } from '../../domain'
import { StatementCard } from '../shared/StatementCard'
import { StatementEmptyState } from '../shared/StatementEmptyState'
import { useStatementTable, type StatementTableState } from './useStatementTable'

type Props = {
  model: StatementModel
}

/**
 * Rejestr faktur — podglad dokumentu, ktory za chwile pojdzie do ksiegowej.
 *
 * Ekran pokazuje DOKLADNIE te dane, co PDF, wiec bledy widac przed wyslaniem,
 * a nie po. Desktop dostaje tabele, telefon liste kart: dziewiec kolumn na
 * 375 px to nieczytelna plachta, wiec na waskim ekranie najwazniejsze pola
 * stoja od razu, a miejsca pracy ida pod spodem.
 */
export function StatementTable({ model }: Props) {
  const t = useTranslations('accounting')
  const table = useStatementTable(model.rows)

  return (
    <StatementCard
      title={t('table.title')}
      ariaLabel={t('table.sectionLabel')}
      action={
        <span className="text-2xs tabular-nums text-zinc-400">
          {t('table.rowCount', { count: model.rows.length })}
        </span>
      }
    >
      {model.rows.length === 0 ? (
        <StatementEmptyState
          icon={ListX}
          title={t('table.empty')}
          description={t('states.noInvoicesDescription')}
          className="mt-4"
        />
      ) : (
        <>
          <DesktopTable rows={table.rows} />
          <MobileList rows={table.rows} />
          <Pagination table={table} />
        </>
      )}
    </StatementCard>
  )
}

/** Miejsca pracy jednej faktury; `null` gdy nie ma zadnego. */
function LocationLines({ row }: { row: StatementRow }) {
  const t = useTranslations('accounting')

  if (row.worksites.length === 0) {
    return <span className="text-zinc-500">{t('table.noLocation')}</span>
  }

  return (
    <ul className="space-y-0.5">
      {row.worksites.map((worksite) => (
        <li key={worksite.projectId ?? 'unassigned'} className="truncate">
          {worksite.location ?? worksite.projectName ?? t('table.noAddress')}
        </li>
      ))}
    </ul>
  )
}

function periodLabel(row: StatementRow, fmt: AppFormat, noPeriod: string): string {
  return row.period ? fmt.dateRange(row.period.start, row.period.end) : noPeriod
}

function DesktopTable({ rows }: { rows: StatementRow[] }) {
  const t = useTranslations('accounting')
  const fmt = useFormat()

  return (
    <div className="mt-4 hidden overflow-x-auto lg:block">
      <table className="w-full text-left text-xs">
        <thead className={cn('text-2xs uppercase tracking-wide', LINEAR.textMuted)}>
          <tr className="border-b border-hairline">
            <th scope="col" className="px-2 py-2 font-medium">{t('table.invoiceNumber')}</th>
            <th scope="col" className="px-2 py-2 font-medium">{t('table.issueDate')}</th>
            <th scope="col" className="px-2 py-2 font-medium">{t('table.period')}</th>
            <th scope="col" className="px-2 py-2 font-medium">{t('table.buyer')}</th>
            <th scope="col" className="px-2 py-2 font-medium">{t('table.location')}</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">{t('table.hours')}</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">{t('table.net')}</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">{t('table.vat')}</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">{t('table.gross')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((row) => (
            <tr key={row.id} className="align-top text-zinc-300">
              <td className="px-2 py-2">
                <span className="font-medium text-white">{row.invoiceNumber}</span>
                {/* Nazwa statusu jest ta sama na ekranie i w dokumencie, wiec
                    czyta sie ja z `document.status` — w jezyku PANELU, bo tu
                    patrzy wlasciciel konta, a nie ksiegowa. */}
                <span className="block text-2xs text-zinc-500">
                  {t(`document.status.${row.status}`)}
                </span>
              </td>
              <td className="whitespace-nowrap px-2 py-2 tabular-nums">
                {fmt.date(row.issueDate, 'short')}
              </td>
              <td
                className={cn('whitespace-nowrap px-2 py-2 tabular-nums', !row.period && 'text-zinc-500')}
              >
                {periodLabel(row, fmt, t('table.noPeriod'))}
              </td>
              <td className="max-w-[14rem] px-2 py-2">
                <span className="block truncate text-zinc-200">
                  {row.party.name ?? t('table.noValue')}
                </span>
                {row.party.taxId && (
                  <span className="block truncate text-2xs text-zinc-500">{row.party.taxId}</span>
                )}
              </td>
              <td className="max-w-[16rem] px-2 py-2">
                <LocationLines row={row} />
                {row.workedDays > 0 && (
                  <span className="block text-2xs text-zinc-500">
                    {t('table.workedDays', { count: row.workedDays })}
                  </span>
                )}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{fmt.hours(row.hours)}</td>
              <td className="px-2 py-2 text-right tabular-nums">
                {fmt.money(row.netMinor, row.currency)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {fmt.money(row.vatMinor, row.currency)}
              </td>
              <td className="px-2 py-2 text-right font-medium tabular-nums text-white">
                {fmt.money(row.grossMinor, row.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileList({ rows }: { rows: StatementRow[] }) {
  const t = useTranslations('accounting')
  const fmt = useFormat()

  return (
    <ul className="mt-4 space-y-2 lg:hidden">
      {rows.map((row) => (
        <li key={row.id} className={cn(SURFACE.cardNested, 'space-y-2 p-3')}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-white">
              {row.invoiceNumber}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
              {fmt.money(row.grossMinor, row.currency)}
            </span>
          </div>

          <p className="truncate text-xs text-zinc-300">{row.party.name ?? t('table.noValue')}</p>
          {formatPartyAddress(row) !== '' && (
            <p className="truncate text-2xs text-zinc-500">{formatPartyAddress(row)}</p>
          )}

          <p className={cn('text-2xs tabular-nums', row.period ? 'text-zinc-400' : 'text-zinc-500')}>
            {t('table.period')}: {periodLabel(row, fmt, t('table.noPeriod'))}
          </p>

          <div className="flex items-start gap-1.5 text-2xs text-zinc-400">
            <MapPin aria-hidden className="mt-px size-3 shrink-0" />
            <div className="min-w-0">
              <LocationLines row={row} />
            </div>
          </div>

          <p className="text-2xs tabular-nums text-zinc-500">
            {t('table.net')}: {fmt.money(row.netMinor, row.currency)} · {t('table.vat')}:{' '}
            {fmt.money(row.vatMinor, row.currency)} · {fmt.hours(row.hours)}
          </p>
        </li>
      ))}
    </ul>
  )
}

function Pagination({ table }: { table: StatementTableState }) {
  const t = useTranslations('accounting')
  if (table.pageCount <= 1) return null

  const button = cn(
    'inline-flex size-9 items-center justify-center rounded-lg border text-zinc-300 transition-colors hover:bg-surface-3 disabled:opacity-40',
    LINEAR.border,
    LINEAR.surface,
  )

  return (
    <nav className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3">
      <button
        type="button"
        onClick={() => table.goToPage(table.page - 1)}
        disabled={table.page === 0}
        aria-label={t('table.previousPage')}
        className={button}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>

      <span aria-live="polite" className="text-2xs tabular-nums text-zinc-400">
        {t('table.pageStatus', { page: table.page + 1, pages: table.pageCount })}
      </span>

      <button
        type="button"
        onClick={() => table.goToPage(table.page + 1)}
        disabled={table.page >= table.pageCount - 1}
        aria-label={t('table.nextPage')}
        className={button}
      >
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </nav>
  )
}
