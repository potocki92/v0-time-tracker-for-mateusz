'use client'

import { useMemo, useState } from 'react'
import type { ReportRecord } from '../../domain'

export type ReportTableColumn = 'date' | 'client' | 'project' | 'hours' | 'value'
export type SortDirection = 'asc' | 'desc'

export type ReportTableState = {
  rows: ReportRecord[]
  sortBy: ReportTableColumn
  direction: SortDirection
  page: number
  pageCount: number
  toggleSort: (column: ReportTableColumn) => void
  goToPage: (page: number) => void
}

/** Ile wierszy trafia do DOM na raz. Reszta czeka na kolejna strone. */
const REPORT_TABLE_PAGE_SIZE = 15

function compare(a: ReportRecord, b: ReportRecord, column: ReportTableColumn): number {
  switch (column) {
    case 'date':
      return a.date.localeCompare(b.date)
    case 'client':
      return (a.clientName ?? '').localeCompare(b.clientName ?? '')
    case 'project':
      return (a.projectName ?? '').localeCompare(b.projectName ?? '')
    case 'hours':
      return a.hours - b.hours
    case 'value':
      return a.valueBaseMinor - b.valueBaseMinor
  }
}

/**
 * Sortowanie i stronicowanie tabeli szczegolowej.
 *
 * Swiadomie BEZ `@tanstack/react-table`: tabela raportu nie ma filtrowania,
 * zaznaczania, zmiany kolejnosci ani chowania kolumn — czyli niczego, za co
 * placi sie ta biblioteka. Wspolny `<DataTable>` dokladalby do trasy takze
 * dnd-kit i pasek narzedzi, a jego uklad wymusza poziomy scroll, ktorego
 * na telefonie nie chcemy. Trzydziesci linii sortowania jest tansze i robi
 * dokladnie to, co trzeba.
 *
 * Zmiana zakresu resetuje strone: `page` jest przycinana do liczby stron
 * aktualnego zbioru, wiec filtr zwezajacy dane nie zostawia pustego widoku.
 */
export function useReportTable(records: ReportRecord[]): ReportTableState {
  const [sortBy, setSortBy] = useState<ReportTableColumn>('date')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [requestedPage, setRequestedPage] = useState(0)

  const sorted = useMemo(() => {
    const factor = direction === 'asc' ? 1 : -1
    return [...records].sort((a, b) => compare(a, b, sortBy) * factor || a.id.localeCompare(b.id))
  }, [records, sortBy, direction])

  const pageCount = Math.max(1, Math.ceil(sorted.length / REPORT_TABLE_PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount - 1)

  return {
    rows: sorted.slice(page * REPORT_TABLE_PAGE_SIZE, (page + 1) * REPORT_TABLE_PAGE_SIZE),
    sortBy,
    direction,
    page,
    pageCount,
    toggleSort: (column) => {
      setRequestedPage(0)
      if (column === sortBy) {
        setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
        return
      }
      setSortBy(column)
      // Daty i kwoty czyta sie od najnowszych/najwiekszych, nazwy od A.
      setDirection(column === 'client' || column === 'project' ? 'asc' : 'desc')
    },
    goToPage: (next) => setRequestedPage(Math.max(0, Math.min(next, pageCount - 1))),
  }
}
