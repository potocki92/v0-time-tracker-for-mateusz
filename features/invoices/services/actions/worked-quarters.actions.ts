'use server'

import {
  getOverallQuarterSummaries,
  getWorkedQuartersForClient,
  type OverallQuarterSummary,
  type WorkedQuarterSummary,
} from '../server/worked-quarters.service.server'

export async function fetchWorkedQuartersAction(input: {
  clientId: string
  count?: number
}): Promise<WorkedQuarterSummary[]> {
  return getWorkedQuartersForClient(input)
}

export async function fetchOverallQuartersAction(count = 4): Promise<OverallQuarterSummary[]> {
  return getOverallQuarterSummaries(count)
}
