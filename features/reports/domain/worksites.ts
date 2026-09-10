import type { DateKey, ReportRecord, WorksitePeriod } from './types'

type Accumulator = {
  projectId: string | null
  projectName: string | null
  clientName: string | null
  location: string | null
  from: DateKey
  to: DateKey
  dates: Set<DateKey>
  hours: number
}

/**
 * Zestawienie „gdzie i kiedy pracowalem" — jeden wiersz na projekt.
 *
 * Odpowiada na pytanie ksiegowej przy przedluzaniu A1: w jakim okresie,
 * w ktorym miejscu i ile godzin. Grupowanie idzie po PROJEKCIE, bo to projekt
 * niesie adres wykonywania pracy (`projects.address`); wpisy bez projektu
 * trafiaja do jednego wiersza z `projectName === null` — UI podstawia
 * etykiete zastepcza.
 *
 * `from`/`to` to skrajne dni Z PRACA w tym projekcie, wiec dla wyjazdu
 * przerwanego weekendem zakres pozostaje ciagly, a `workedDays` mowi, ile dni
 * realnie przepracowano.
 *
 * UWAGA: suma `workedDays` po wierszach moze przekroczyc liczbe dni z praca
 * w okresie — jeden dzien z praca w dwoch projektach liczy sie w obu. Sume
 * calosciowa bierze sie z `ReportKpis`, nie z dodawania tej kolumny.
 */
export function buildWorksitePeriods(records: ReportRecord[]): WorksitePeriod[] {
  const byProject = new Map<string, Accumulator>()

  for (const record of records) {
    const key = record.projectId ?? ''
    const existing = byProject.get(key)

    if (!existing) {
      byProject.set(key, {
        projectId: record.projectId,
        projectName: record.projectName,
        clientName: record.clientName,
        location: record.projectAddress,
        from: record.date,
        to: record.date,
        dates: new Set([record.date]),
        hours: record.hours,
      })
      continue
    }

    existing.dates.add(record.date)
    existing.hours += record.hours
    if (record.date < existing.from) existing.from = record.date
    if (record.date > existing.to) existing.to = record.date
    // Etykiety moga dojechac dopiero z kolejnym wpisem: starszy wiersz wskazuje
    // usunietego klienta albo projekt bez adresu, nowszy — komplet danych.
    existing.projectName ??= record.projectName
    existing.clientName ??= record.clientName
    existing.location ??= record.projectAddress
  }

  return [...byProject.values()]
    .map(({ dates, ...period }) => ({ ...period, workedDays: dates.size }))
    .sort((a, b) => a.from.localeCompare(b.from) || b.hours - a.hours)
}
