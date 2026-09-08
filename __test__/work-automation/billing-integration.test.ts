import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { computeReportSummary, workedEntriesInRange } from '@/features/reports/lib/analytics'
import { isRealEntry } from '@/lib/finance/realization'
import type { WorkEntry } from '@/lib/types'

/**
 * Automat tworzy wpis `real` takze dla dni, dla ktorych istnieje juz reczny
 * plan `predicted`. Bez filtru na rodzaj wpisu ta sama data trafialaby
 * do raportu i na fakture dwa razy.
 */

const entry = (overrides: Partial<WorkEntry>): WorkEntry =>
  ({
    id: overrides.id ?? 'e1',
    user_id: 'user-a',
    client_id: 'client-a',
    project_id: null,
    date: '2026-09-08',
    status: 'worked',
    entry_kind: 'real',
    hours: 10,
    quantity: null,
    quantity_from: null,
    quantity_to: null,
    category: null,
    tags: [],
    notes: null,
    billing_rate: 100,
    billing_currency: 'PLN',
    billing_work_type: 'hourly',
    billing_unit: null,
    created_at: '2026-09-08T18:00:00.000Z',
    ...overrides,
  }) as WorkEntry

const FILTERS = {
  preset: 'custom' as const,
  from: '2026-09-08',
  to: '2026-09-08',
  clientId: 'all',
  projectId: 'all',
  tag: 'all',
  compare: false,
}

describe('isRealEntry', () => {
  it('brak `entry_kind` znaczy `real` — dane sprzed migracji nie znikaja', () => {
    expect(isRealEntry({ entry_kind: undefined })).toBe(true)
    expect(isRealEntry({ entry_kind: 'real' })).toBe(true)
    expect(isRealEntry({ entry_kind: 'predicted' })).toBe(false)
  })
})

describe('raporty nie naliczaja planu i wykonania dla tej samej daty', () => {
  const entries = [
    entry({ id: 'plan', entry_kind: 'predicted', hours: 12 }),
    entry({ id: 'real', entry_kind: 'real', hours: 10 }),
  ]

  it('liczy tylko godziny wpisu rzeczywistego', () => {
    const summary = computeReportSummary(entries, [], [], FILTERS, '2026-09-08')
    expect(summary.totalHours).toBe(10)
    expect(summary.workedCount).toBe(1)
  })

  it('eksport dni z zakresu tez pomija plan', () => {
    const worked = workedEntriesInRange(entries, FILTERS, '2026-09-08')
    expect(worked.map((row) => row.id)).toEqual(['real'])
  })
})

describe('fakturowanie czyta wylacznie wpisy rzeczywiste', () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

  const BILLING_SOURCES = [
    'features/invoices/services/server/invoices.service.server.ts',
    'features/invoices/services/server/worked-weeks.service.server.ts',
    'features/invoices/services/server/worked-quarters.service.server.ts',
  ]

  it.each(BILLING_SOURCES)('%s zaweza zapytanie do entry_kind = real', (file) => {
    const source = read(file)
    const reads = source.split("from('work_entries')").length - 1
    const filters = source.split("eq('entry_kind', 'real')").length - 1

    expect(reads).toBeGreaterThan(0)
    expect(filters, 'kazdy odczyt work_entries w rozliczeniu ma filtr rodzaju').toBe(reads)
  })
})
