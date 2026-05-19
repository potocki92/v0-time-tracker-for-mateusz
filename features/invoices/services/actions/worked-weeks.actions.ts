'use server'

import {
  getWorkedWeeksForClient,
  type WorkedWeekSummary,
} from '../server/worked-weeks.service.server'

interface FetchInput {
  clientId: string
  from?: string
  to?: string
}

/**
 * Server action wrapper around `getWorkedWeeksForClient`.
 *
 * Kept separate from the service module because Next.js requires every
 * exported function in a `'use server'` file with `use server` directive
 * to be either an async server action or a private helper — the service
 * file already mixes those concerns and re-exporting a typed entry-point
 * here keeps the boundary explicit for client components that need to
 * call into it via React Query.
 */
export async function fetchWorkedWeeksAction(input: FetchInput): Promise<WorkedWeekSummary[]> {
  return getWorkedWeeksForClient(input)
}
