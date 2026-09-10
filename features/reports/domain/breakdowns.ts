import type { BreakdownDimension, BreakdownItem, ReportRecord } from './types'

type Accumulator = {
  key: string
  label: string | null
  hours: number
  valueBaseMinor: number
  entryCount: number
}

/** Klucz i etykieta rekordu w danym przekroju. Tag zwraca WIELE par. */
function keysOf(record: ReportRecord, dimension: BreakdownDimension): Array<[string, string | null]> {
  switch (dimension) {
    case 'client':
      return [[record.clientId ?? '', record.clientName]]
    case 'project':
      return [[record.projectId ?? '', record.projectName]]
    case 'tag':
      return record.tags.length > 0
        ? record.tags.map((tag) => [tag, tag] as [string, string])
        : [['', null]]
  }
}

/**
 * Udzial czasu i wartosci pracy w wybranym przekroju, posortowany malejaco
 * po godzinach.
 *
 * UWAGA dla przekroju `tag`: wpis z trzema tagami wchodzi do trzech pozycji,
 * wiec suma udzialow moze przekroczyc 100%. To wlasciwosc tagow, nie blad —
 * mianownikiem zostaja godziny CALEGO okresu, zeby „25%" znaczylo to samo
 * w kazdym przekroju.
 *
 * Pozycje bez przypisania (brak klienta/projektu/tagu) maja `label === null`;
 * etykiete podstawia UI z i18n, bo nazwa klienta jest dana uzytkownika,
 * a „bez przypisania" jest tekstem interfejsu.
 */
export function buildBreakdown(
  records: ReportRecord[],
  dimension: BreakdownDimension,
): BreakdownItem[] {
  const accumulators = new Map<string, Accumulator>()
  let totalHours = 0

  for (const record of records) {
    totalHours += record.hours
    for (const [key, label] of keysOf(record, dimension)) {
      const existing = accumulators.get(key)
      if (existing) {
        existing.hours += record.hours
        existing.valueBaseMinor += record.valueBaseMinor
        existing.entryCount += 1
        // Etykieta moze dojechac dopiero z kolejnym wpisem (starszy wiersz
        // wskazuje usunietego klienta, nowszy — istniejacego).
        existing.label ??= label
        continue
      }
      accumulators.set(key, {
        key,
        label,
        hours: record.hours,
        valueBaseMinor: record.valueBaseMinor,
        entryCount: 1,
      })
    }
  }

  return [...accumulators.values()]
    .map((acc) => ({
      key: acc.key,
      label: acc.label,
      hours: acc.hours,
      share: totalHours > 0 ? acc.hours / totalHours : 0,
      valueBaseMinor: acc.valueBaseMinor,
      effectiveHourlyRateMinor: acc.hours > 0 ? acc.valueBaseMinor / acc.hours : null,
      entryCount: acc.entryCount,
    }))
    .sort((a, b) => b.hours - a.hours || b.valueBaseMinor - a.valueBaseMinor)
}

export function buildAllBreakdowns(
  records: ReportRecord[],
): Record<BreakdownDimension, BreakdownItem[]> {
  return {
    client: buildBreakdown(records, 'client'),
    project: buildBreakdown(records, 'project'),
    tag: buildBreakdown(records, 'tag'),
  }
}
