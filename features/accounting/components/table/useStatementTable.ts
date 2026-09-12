'use client'

import { useState } from 'react'
import type { StatementRow } from '../../domain'

export type StatementTableState = {
  rows: StatementRow[]
  page: number
  pageCount: number
  goToPage: (page: number) => void
}

/** Ile wierszy trafia do DOM na raz. Reszta czeka na kolejna strone. */
const STATEMENT_PAGE_SIZE = 15

/**
 * Stronicowanie rejestru.
 *
 * Swiadomie BEZ sortowania: rejestr sprzedazy ma jedna poprawna kolejnosc —
 * chronologiczna po dacie wystawienia (ustala ja `buildStatementModel`).
 * Przestawienie kolumn na ekranie rozjechaloby widok z dokumentem, ktory
 * uzytkownik za chwile wysyla, a tego nie chce ani on, ani ksiegowa.
 *
 * `page` jest przycinana do liczby stron aktualnego zbioru, wiec zmiana
 * zakresu nie zostawia pustego widoku.
 */
export function useStatementTable(rows: StatementRow[]): StatementTableState {
  const [requestedPage, setRequestedPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(rows.length / STATEMENT_PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount - 1)

  return {
    rows: rows.slice(page * STATEMENT_PAGE_SIZE, (page + 1) * STATEMENT_PAGE_SIZE),
    page,
    pageCount,
    goToPage: (next) => setRequestedPage(Math.max(0, Math.min(next, pageCount - 1))),
  }
}
