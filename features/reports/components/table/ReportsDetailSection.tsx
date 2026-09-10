'use client'

import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ListX } from 'lucide-react'
import { NO_DATA } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import type { ReportModel, ReportRecord } from '../../domain'
import type { CURRENCY } from '@/lib/types'
import { ReportCard } from '../shared/ReportCard'
import { ReportEmptyState } from '../shared/ReportEmptyState'
import { useReportTable, type ReportTableColumn, type ReportTableState } from './useReportTable'

type Props = {
  model: ReportModel
}

const SORTABLE: Array<{ column: ReportTableColumn; key: string; numeric: boolean }> = [
  { column: 'date', key: 'date', numeric: false },
  { column: 'client', key: 'client', numeric: false },
  { column: 'project', key: 'project', numeric: false },
  { column: 'hours', key: 'hours', numeric: true },
  { column: 'value', key: 'value', numeric: true },
]

/**
 * Szczegolowe dane wpisow.
 *
 * Desktop dostaje tabele, telefon — liste kart. To NIE jest ta sama tabela
 * ze scrollem poziomym: 11 kolumn na 375 px to nieczytelna plachta, wiec
 * na waskim ekranie najwazniejsze pola stoja od razu, a reszta (stawka,
 * waluta, tagi, zrodlo) siedzi w drugim wierszu karty.
 */
export function ReportsDetailSection({ model }: Props) {
  const t = useTranslations('reports')
  const table = useReportTable(model.records)

  return (
    <ReportCard
      title={t('table.title')}
      ariaLabel={t('table.sectionLabel')}
      action={
        <span className="text-2xs tabular-nums text-zinc-400">
          {t('table.rowCount', { count: model.records.length })}
        </span>
      }
    >
      {model.records.length === 0 ? (
        <ReportEmptyState
          icon={ListX}
          title={t('table.empty')}
          description={t('states.noMatchDescription')}
          className="mt-4"
        />
      ) : (
        <>
          <DesktopTable table={table} currency={model.currency} />
          <MobileList rows={table.rows} currency={model.currency} />
          <Pagination table={table} />
        </>
      )}
    </ReportCard>
  )
}

function SortButton({
  table,
  column,
  label,
  numeric,
}: {
  table: ReportTableState
  column: ReportTableColumn
  label: string
  numeric: boolean
}) {
  const t = useTranslations('reports')
  const active = table.sortBy === column
  const Icon = table.direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <th
      scope="col"
      aria-sort={active ? (table.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-2 py-2 font-medium', numeric && 'text-right')}
    >
      <button
        type="button"
        onClick={() => table.toggleSort(column)}
        aria-label={t('table.sortBy', { column: label })}
        className={cn(
          'inline-flex items-center gap-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
          active ? 'text-zinc-200' : 'text-zinc-400 hover:text-zinc-200',
        )}
      >
        {label}
        {active && <Icon aria-hidden className="size-3" />}
      </button>
    </th>
  )
}

function DesktopTable({ table, currency }: { table: ReportTableState; currency: CURRENCY }) {
  const t = useTranslations('reports')
  const fmt = useFormat()

  return (
    <div className="mt-4 hidden md:block">
      <table className="w-full text-sm">
        <thead className={cn('border-b text-2xs uppercase', LINEAR.border)}>
          <tr>
            {SORTABLE.map((column) => (
              <SortButton
                key={column.column}
                table={table}
                column={column.column}
                label={t(`table.${column.key}`)}
                numeric={column.numeric}
              />
            ))}
            <th scope="col" className="px-2 py-2 text-right font-medium text-zinc-400">
              {t('table.quantity')}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium text-zinc-400">
              {t('table.rate')}
            </th>
            <th scope="col" className="px-2 py-2 font-medium text-zinc-400">
              {t('table.source')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {table.rows.map((row) => (
            <tr key={row.id} className="text-zinc-300">
              <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">
                {fmt.date(row.date, 'short')}
              </td>
              <td className="max-w-40 truncate px-2 py-2.5">{row.clientName ?? NO_DATA}</td>
              <td className="max-w-40 truncate px-2 py-2.5">{row.projectName ?? NO_DATA}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{fmt.hours(row.hours)}</td>
              <td className="px-2 py-2.5 text-right tabular-nums text-white">
                {fmt.money(row.valueBaseMinor, currency)}
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums text-zinc-400">
                {row.workType === 'piecework' ? fmt.number(row.quantity) : NO_DATA}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-zinc-400">
                {fmt.money(row.appliedRateMinor, row.appliedCurrency)}
              </td>
              <td className="px-2 py-2.5 text-2xs text-zinc-400">{t(`table.${row.source}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileList({ rows, currency }: { rows: ReportRecord[]; currency: CURRENCY }) {
  const t = useTranslations('reports')
  const fmt = useFormat()

  return (
    <ul role="list" className="mt-4 divide-y divide-hairline md:hidden">
      {rows.map((row) => (
        <li key={row.id} className="space-y-1 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-zinc-200">
              {row.clientName ?? NO_DATA}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
              {fmt.money(row.valueBaseMinor, currency)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-2xs text-zinc-400">
            <span className="min-w-0 truncate">
              {fmt.date(row.date, 'short')}
              {row.projectName ? ` · ${row.projectName}` : ''}
            </span>
            <span className="shrink-0 tabular-nums">
              {row.workType === 'piecework'
                ? `${fmt.hours(row.hours)} · ${fmt.number(row.quantity)}`
                : fmt.hours(row.hours)}
              {' · '}
              {fmt.money(row.appliedRateMinor, row.appliedCurrency)}
            </span>
          </div>
          {row.tags.length > 0 && (
            <p className="truncate text-2xs text-zinc-400">
              <span className="sr-only">{t('table.tags')}: </span>
              {row.tags.join(' · ')}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

function Pagination({ table }: { table: ReportTableState }) {
  const t = useTranslations('reports')

  if (table.pageCount <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3">
      <PageButton
        label={t('table.previousPage')}
        icon={ChevronLeft}
        disabled={table.page === 0}
        onClick={() => table.goToPage(table.page - 1)}
      />
      <span aria-live="polite" className="text-2xs tabular-nums text-zinc-400">
        {t('table.pageStatus', { page: table.page + 1, pages: table.pageCount })}
      </span>
      <PageButton
        label={t('table.nextPage')}
        icon={ChevronRight}
        disabled={table.page >= table.pageCount - 1}
        onClick={() => table.goToPage(table.page + 1)}
      />
    </div>
  )
}

function PageButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string
  icon: typeof ChevronLeft
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-lg border text-zinc-300 transition-colors hover:bg-surface-3 disabled:opacity-40',
        LINEAR.border,
        LINEAR.surface,
      )}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  )
}
