import { addDaysIso } from '@/features/trips/domain'
import type { DateRange, PresenceState } from './workAutomation.types'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Scala wyjazdy w rozlaczne okresy pracy poza domem.
 *
 * Scalamy takze zakresy PRZYLEGAJACE (koniec + 1 dzien = poczatek nastepnego):
 * miedzy nimi nie ma ani jednego dnia w domu, wiec bez tego kroku zachodzace
 * na siebie albo stykajace sie wyjazdy tworzylyby fałszywa przerwe w srodku
 * trwajacego wyjazdu.
 */
export function mergeTripRanges(ranges: readonly DateRange[]): DateRange[] {
  const valid = ranges
    .filter(
      (range) =>
        ISO_DATE.test(range.startDate) &&
        ISO_DATE.test(range.endDate) &&
        range.startDate <= range.endDate,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const merged: DateRange[] = []

  for (const range of valid) {
    const last = merged[merged.length - 1]
    if (last && range.startDate <= addDaysIso(last.endDate, 1)) {
      if (range.endDate > last.endDate) last.endDate = range.endDate
      continue
    }
    merged.push({ ...range })
  }

  return merged
}

export interface PresenceInput {
  date: string
  trips: readonly DateRange[]
  /** Daty jawnych wznowien pracy. */
  resumptions: readonly string[]
  /** `startDate` obowiazujacej wersji konfiguracji. */
  activationDate: string
}

/**
 * Czy dana data nalezy do okresu pracy, czy do pobytu w domu.
 *
 * Zdarzenia rozstrzygamy chronologicznie, nie w kolejnosci rekordow:
 * - dzien powrotu (`endDate`) jest jeszcze dniem pracy — powrot nastepuje po
 *   pracy, wiec pobyt w domu zaczyna sie dopiero nastepnego dnia,
 * - jawne wznowienie pozniejsze niz ostatni powrot otwiera nowy okres pracy,
 * - powrot pozniejszy niz wznowienie ten okres zamyka.
 *
 * Dwa przypadki brzegowe maja rozne odpowiedzi mimo tego samego „nie ma
 * trwajacego wyjazdu":
 * - wyjazd zakonczony JUZ PO uruchomieniu automatu wstrzymuje dopisywanie —
 *   uzytkownik wrocil do domu i nie wiadomo, kiedy jedzie znowu,
 * - wyjazd zakonczony PRZED uruchomieniem to archiwum; gdyby blokowal, automat
 *   nie zapisalby nigdy nic. Wtedy o wyniku decyduje istnienie przyszlego
 *   wyjazdu: jesli jest, czekamy w domu na jego poczatek, jesli nie ma —
 *   pracujemy wedlug grafiku.
 */
export function resolvePresence({
  date,
  trips,
  resumptions,
  activationDate,
}: PresenceInput): PresenceState {
  const merged = mergeTripRanges(trips)

  if (merged.some((trip) => trip.startDate <= date && date <= trip.endDate)) {
    return { at: 'work', because: 'trip' }
  }

  const hasFutureTrip = merged.some((trip) => trip.startDate > date)

  const lastReturn = merged
    .filter((trip) => trip.endDate < date)
    .reduce<string | null>((latest, trip) => (latest && latest > trip.endDate ? latest : trip.endDate), null)

  const lastResumption = resumptions
    .filter((resumption) => ISO_DATE.test(resumption) && resumption <= date)
    .reduce<string | null>((latest, resumption) => (latest && latest > resumption ? latest : resumption), null)

  if (lastResumption && (!lastReturn || lastResumption > lastReturn)) {
    return { at: 'work', because: 'resumption' }
  }

  if (lastReturn) {
    if (lastReturn >= activationDate) {
      return { at: 'home', because: hasFutureTrip ? 'between_trips' : 'after_return' }
    }
    return hasFutureTrip
      ? { at: 'home', because: 'awaiting_first_trip' }
      : { at: 'work', because: 'archived_trips_only' }
  }

  return hasFutureTrip
    ? { at: 'home', because: 'awaiting_first_trip' }
    : { at: 'work', because: 'no_trips' }
}
