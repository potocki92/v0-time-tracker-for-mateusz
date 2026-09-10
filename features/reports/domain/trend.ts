import { isoWeekKey } from '@/lib/metrics/period'
import type {
  DateKey,
  ReportRange,
  ReportRecord,
  ReportTrend,
  TrendBucketUnit,
  TrendPoint,
} from './types'
import { eachDayInRange, spanInDays } from './range'

/**
 * Progi doboru jednostki wykresu. Wyprowadzone z liczby slupkow, ktora da sie
 * przeczytac na ekranie telefonu (~375 px): do 31 slupkow dziennych jeszcze
 * widac, powyzej — tygodnie, a od pol roku miesiace.
 */
const MAX_DAYS_AS_DAYS = 31
const MAX_DAYS_AS_WEEKS = 182

/**
 * Jednostka kubelkowania dla zakresu o zadanej dlugosci.
 * Czysta funkcja — to ona decyduje o czytelnosci wykresu, wiec ma testy.
 */
export function resolveBucketUnit(days: number): TrendBucketUnit {
  if (days <= MAX_DAYS_AS_DAYS) return 'day'
  if (days <= MAX_DAYS_AS_WEEKS) return 'week'
  return 'month'
}

/** Klucz kubelka, do ktorego nalezy dana data. */
export function bucketKeyOf(date: DateKey, unit: TrendBucketUnit): string {
  if (unit === 'day') return date
  if (unit === 'month') return date.slice(0, 7)
  return isoWeekKey(date)
}

type Bucket = { key: string; start: DateKey; end: DateKey; hours: number; valueBaseMinor: number }

/**
 * Szkielet kubelkow dla zakresu — wszystkie, takze puste.
 *
 * Puste kubelki musza istniec, inaczej wykres „sklei" tydzien bez pracy
 * z sasiednim i pokazalby ciaglosc, ktorej nie bylo.
 */
function emptyBuckets(range: ReportRange, unit: TrendBucketUnit): Bucket[] {
  const buckets: Bucket[] = []
  const index = new Map<string, Bucket>()

  for (const day of eachDayInRange(range)) {
    const key = bucketKeyOf(day, unit)
    const existing = index.get(key)
    if (existing) {
      existing.end = day
      continue
    }
    const bucket: Bucket = { key, start: day, end: day, hours: 0, valueBaseMinor: 0 }
    index.set(key, bucket)
    buckets.push(bucket)
  }

  return buckets
}

function fill(range: ReportRange, unit: TrendBucketUnit, records: ReportRecord[]): Bucket[] {
  const buckets = emptyBuckets(range, unit)
  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const record of records) {
    const bucket = index.get(bucketKeyOf(record.date, unit))
    if (!bucket) continue
    bucket.hours += record.hours
    bucket.valueBaseMinor += record.valueBaseMinor
  }

  return buckets
}

/**
 * Szereg czasowy raportu.
 *
 * Kubelki poprzedniego okresu sa dopasowywane POZYCYJNIE (i-ty kubelek do
 * i-tego), nie po dacie: okresy maja te sama dlugosc, wiec „drugi tydzien
 * okresu" ma sens jako para, a kalendarzowe klucze nigdy by sie nie zgadzaly.
 *
 * @param range      zakres raportu
 * @param records    rekordy biezacego okresu
 * @param previous   rekordy poprzedniego okresu wraz z jego zakresem; `null` gdy porownanie wylaczone
 */
export function buildTrend(
  range: ReportRange,
  records: ReportRecord[],
  previous: { range: ReportRange; records: ReportRecord[] } | null,
): ReportTrend {
  const unit = resolveBucketUnit(spanInDays(range))
  const current = fill(range, unit, records)
  const before = previous ? fill(previous.range, unit, previous.records) : null

  const points: TrendPoint[] = current.map((bucket, i) => {
    // Poprzedni okres bywa o jeden kubelek dluzszy/krotszy (miesiace maja
    // rozna liczbe dni) — liczymy od konca, zeby ostatni kubelek pokryl sie
    // z ostatnim, a nie zeby przesuniecie rozjechalo caly wykres.
    const mirrored = before ? before[before.length - current.length + i] : undefined
    return {
      key: bucket.key,
      start: bucket.start,
      end: bucket.end,
      hours: bucket.hours,
      valueBaseMinor: bucket.valueBaseMinor,
      previousHours: before ? (mirrored?.hours ?? 0) : null,
      previousValueBaseMinor: before ? (mirrored?.valueBaseMinor ?? 0) : null,
    }
  })

  return { unit, points }
}

/**
 * Ile etykiet osi X zmiesci sie bez zlewania. Recharts dostaje `interval`,
 * czyli „pomijaj N etykiet miedzy pokazanymi".
 */
export function axisTickInterval(pointCount: number, maxLabels: number): number {
  if (pointCount <= maxLabels) return 0
  return Math.ceil(pointCount / maxLabels) - 1
}
