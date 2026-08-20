/**
 * Okno czasowe dla `work_entries`.
 *
 * Wpisy pracy rosną w nieskończoność, a dashboard / kalendarz / projekty
 * pobierały do tej pory całą historię przy każdym wejściu. Domyślnie
 * ładujemy ostatnie `WORK_ENTRIES_WINDOW_MONTHS` miesięcy.
 *
 * Granica jest kotwiczona do pierwszego dnia miesiąca i liczona w UTC, żeby
 * serwer i przeglądarka wyliczyły dokładnie tę samą wartość — inaczej refetch
 * po hydracji podmieniłby dane na minimalnie inny zbiór.
 */

const WORK_ENTRIES_WINDOW_MONTHS = 24

/** Zwraca `YYYY-MM-01` — początek okna wpisów pracy (włącznie). */
export function getWorkEntriesWindowStart(now: Date = new Date()): string {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - WORK_ENTRIES_WINDOW_MONTHS, 1),
  )

  const year = start.getUTCFullYear()
  const month = String(start.getUTCMonth() + 1).padStart(2, '0')

  return `${year}-${month}-01`
}
