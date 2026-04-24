export const RECURRING_FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'] as const
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number]

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function cloneUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * Compute the next issue date after `current` for a given frequency.
 * All dates are treated as UTC to avoid DST/timezone drift.
 */
export function nextIssueDate(current: string, frequency: RecurringFrequency): string {
  const d = parseIsoDate(current)
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${current}`)
  const next = cloneUtc(d)
  switch (frequency) {
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + 7)
      break
    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + 1)
      break
    case 'quarterly':
      next.setUTCMonth(next.getUTCMonth() + 3)
      break
    case 'yearly':
      next.setUTCFullYear(next.getUTCFullYear() + 1)
      break
  }
  return formatIsoDate(next)
}

export interface ScheduleCandidate {
  id: string
  frequency: RecurringFrequency
  next_issue_date: string
  end_date: string | null
  is_active: boolean
  paused_at: string | null
}

export interface DueResult {
  id: string
  issueDate: string
  newNextIssueDate: string
}

/**
 * Walk all candidates and return the ones that should be issued today
 * (or earlier — catches up on missed runs). When a candidate has a horizon
 * in end_date, stop after that date.
 */
export function findDueRecurringInvoices(
  candidates: ScheduleCandidate[],
  today: Date = new Date(),
): DueResult[] {
  const todayIso = formatIsoDate(cloneUtc(today))
  const due: DueResult[] = []

  for (const candidate of candidates) {
    if (!candidate.is_active || candidate.paused_at) continue
    if (candidate.end_date && candidate.end_date < todayIso) continue
    if (candidate.next_issue_date > todayIso) continue

    due.push({
      id: candidate.id,
      issueDate: candidate.next_issue_date,
      newNextIssueDate: nextIssueDate(candidate.next_issue_date, candidate.frequency),
    })
  }
  return due
}

export function computeDueDate(issueDate: string, dueDays: number): string {
  const d = parseIsoDate(issueDate)
  d.setUTCDate(d.getUTCDate() + dueDays)
  return formatIsoDate(d)
}
