/**
 * Wiersz ustawien automatu, tak jak czyta go cron.
 * Kolumny odpowiadaja migracji `weekly_summary_email`.
 */
export type WeeklySummaryEmailRow = {
  user_id: string
  recipient_email: string | null
  last_sent_week_year: number | null
  last_sent_week_number: number | null
}

/**
 * Idempotencja: czy ten tydzien ISO poszedl juz do tego uzytkownika.
 * Chroni przed dublem, gdy workflow zostanie odpalony recznie po cronie.
 */
export function isSentForWeek(
  row: WeeklySummaryEmailRow,
  weekYear: number,
  weekNumber: number,
): boolean {
  return row.last_sent_week_year === weekYear && row.last_sent_week_number === weekNumber
}
