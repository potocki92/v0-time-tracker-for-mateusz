import type { ReportKpis, ReportRecord } from './types'

/**
 * Szesc liczb, ktore odpowiadaja na pytania „ile pracowalem", „ile to warte"
 * i „jak gesto pracowalem". Wszystkie licza sie z jednego przebiegu po
 * rekordach — komponenty dostaja gotowy wynik.
 *
 * `avgHoursPerActiveDay` dzieli przez DNI Z PRACA, nie przez dlugosc zakresu:
 * „srednio 6,5 h w dniu, w ktorym pracowalem" jest odpowiedzia na pytanie
 * uzytkownika, „srednio 2,1 h dziennie w kwartale" nie jest.
 */
export function computeKpis(records: ReportRecord[]): ReportKpis {
  let totalHours = 0
  let workValueMinor = 0
  let billableHours = 0
  const activeDates = new Set<string>()

  for (const record of records) {
    totalHours += record.hours
    workValueMinor += record.valueBaseMinor
    if (record.billable) billableHours += record.hours
    activeDates.add(record.date)
  }

  const activeDays = activeDates.size

  return {
    totalHours,
    workValueMinor,
    activeDays,
    avgHoursPerActiveDay: activeDays > 0 ? totalHours / activeDays : 0,
    // Akord bez godzin nie ma stawki godzinowej — `null` znaczy „nie da sie
    // policzyc", a nie „zero".
    effectiveHourlyRateMinor: totalHours > 0 ? workValueMinor / totalHours : null,
    billableRatio: totalHours > 0 ? billableHours / totalHours : null,
    entryCount: records.length,
  }
}
