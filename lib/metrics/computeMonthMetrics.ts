import { addDays, eachDay, isWeekend, isoWeekKey } from './period'
import type {
  CurrencyCode,
  DayBreakdown,
  DayKind,
  EarningsMetrics,
  HoursMetrics,
  IsoDate,
  MetricsSettings,
  Minor,
  MonthMetrics,
  MonthMetricsInput,
  WorkEntryInput,
} from './types'

/**
 * JEDNO źródło prawdy dla metryk okna (miesiąc, tydzień, kwartał, rok).
 *
 * Powód istnienia: Pulpit i Kalendarz liczyły te same rzeczy osobno i pokazywały
 * sprzeczne wartości — inny cel godzinowy (160 vs 168), inny zbiór wpisów pod
 * serię, „struktura dni" sumująca się do 35 w 31-dniowym miesiącu, stawka
 * efektywna 0,00 przy realnym przychodzie. Tu wszystko liczy się raz.
 *
 * Dwie reguły, z których wynika reszta:
 *  1. „Zrealizowane" = wpis `real` z datą do `today` włącznie. Wszystkie
 *     wielkości faktyczne (actual, bestDay, stawka efektywna, serie, byProject,
 *     byWeek) czytają wyłącznie taki zbiór.
 *  2. `days` opisuje STRUKTURĘ kalendarzową okna, więc bierze też dni oznaczone
 *     jako praca w przyszłości — dzień z wpisem nigdy nie jest liczony drugi raz
 *     jako weekend czy dzień pusty.
 *
 * Funkcja jest czysta: żadnego `new Date()` w środku, `today` przychodzi z zewnątrz.
 */
export function computeMonthMetrics(input: MonthMetricsInput): MonthMetrics {
  const { period, today, entries, absences, settings } = input

  const deduped = dropSupersededPlans(entries)
  const inWindow = deduped.filter((e) => e.date >= period.from && e.date <= period.to)
  const realized = inWindow.filter(isRealized(today))
  const planned = inWindow.filter((e) => !isRealized(today)(e))
  const absencesInWindow = absences.filter(
    (a) => a.date >= period.from && a.date <= period.to,
  )

  const days = buildDayBreakdown(period.from, period.to, inWindow, absencesInWindow)
  const realizedWorkedDays = new Set(realized.map((e) => e.date)).size

  const amount = (entry: WorkEntryInput) => entryAmountMinor(entry, settings)
  const actualMinor = sumMinor(realized.map(amount))
  const plannedMinor = sumMinor(planned.map(amount))

  const businessDays = countBusinessDays(
    period,
    today,
    new Set(inWindow.map((e) => e.date)),
    new Set(absencesInWindow.map((a) => a.date)),
  )

  const hours = buildHours({
    settings,
    businessDays,
    actual: sumHours(realized),
    plannedFromEntries: sumHours(planned),
    realizedWorkedDays,
  })

  return {
    period,
    today,
    hours,
    earnings: buildEarnings({
      actualMinor,
      plannedMinor,
      realized,
      realizedWorkedDays,
      settings,
    }),
    days,
    realizedWorkedDays,
    plannedDays: new Set(planned.map((e) => e.date)).size + businessDays.open,
    effectiveRateMinorPerHour: buildEffectiveRate(realized, settings),
    ...buildStreaks(deduped, absences, today, settings.absenceBreaksStreak),
    byProject: groupBy(realized, settings, (e) => e.projectId).map(
      ({ key, ...rest }) => ({ projectId: key, ...rest }),
    ),
    byClient: groupBy(realized, settings, (e) => e.clientId).map(
      ({ key, ...rest }) => ({ clientId: key, ...rest }),
    ),
    byWeek: buildByWeek(period.from, period.to, realized, settings),
  }
}

/* ── Wspólne ──────────────────────────────────────────────────────────────── */

const isRealized = (today: IsoDate) => (entry: WorkEntryInput) =>
  entry.kind === 'real' && entry.date <= today

/**
 * Ten sam dzień może mieć wpis potwierdzony i zaplanowany — plan był
 * przewidywaniem, które się już wydarzyło. Bez tego dzień wpadałby raz do
 * `actual` i raz do `planned`, a prognoza liczyła go podwójnie.
 */
function dropSupersededPlans(entries: WorkEntryInput[]): WorkEntryInput[] {
  const confirmed = new Set(
    entries.filter((e) => e.kind === 'real').map((e) => e.date),
  )
  return entries.filter((e) => e.kind === 'real' || !confirmed.has(e.date))
}

/** Godziny to floaty — sumę tniemy do 2 miejsc, żeby nie wyciekło 15.499999999. */
function sumHours(entries: WorkEntryInput[]): number {
  return roundHours(entries.reduce((sum, e) => sum + e.hours, 0))
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100
}

function sumMinor(values: Minor[]): Minor {
  return values.reduce((sum, v) => sum + v, 0)
}

/** Kwota wpisu w walucie wyświetlania. Akord podaje `amountMinor` wprost. */
function entryAmountMinor(entry: WorkEntryInput, settings: MetricsSettings): Minor {
  const own = entry.amountMinor ?? Math.round((entry.rateMinor ?? 0) * entry.hours)
  return convertMinor(own, entry.currency, settings.displayCurrency, settings.eurRateBps)
}

/** Konwersja na intach: kurs w punktach bazowych, jedno zaokrąglenie na końcu. */
function convertMinor(
  value: Minor,
  from: CurrencyCode,
  to: CurrencyCode,
  eurRateBps: number,
): Minor {
  if (from === to || value === 0) return value
  if (eurRateBps <= 0) return 0
  return from === 'EUR'
    ? Math.round((value * eurRateBps) / 10_000)
    : Math.round((value * 10_000) / eurRateBps)
}

/* ── Struktura dni ────────────────────────────────────────────────────────── */

function buildDayBreakdown(
  from: IsoDate,
  to: IsoDate,
  entries: WorkEntryInput[],
  absences: MonthMetricsInput['absences'],
): DayBreakdown {
  const worked = new Set(entries.map((e) => e.date))
  const absenceByDate = new Map(absences.map((a) => [a.date, a.kind]))

  const breakdown: DayBreakdown = {
    totalDays: 0,
    worked: 0,
    vacation: 0,
    sick: 0,
    dayOff: 0,
    weekendIdle: 0,
    weekdayIdle: 0,
  }

  for (const day of eachDay({ from, to, label: '' })) {
    breakdown.totalDays += 1
    switch (classifyDay(day, worked, absenceByDate)) {
      case 'worked':
        breakdown.worked += 1
        break
      case 'vacation':
        breakdown.vacation += 1
        break
      case 'sick':
        breakdown.sick += 1
        break
      case 'dayOff':
        breakdown.dayOff += 1
        break
      case 'weekend':
        breakdown.weekendIdle += 1
        break
      case 'empty':
        breakdown.weekdayIdle += 1
        break
    }
  }

  return breakdown
}

/**
 * Kolejność decyduje o rozłączności kubełków: wpis wygrywa z nieobecnością,
 * nieobecność z weekendem. Bez tego ten sam dzień wpadał do dwóch kubełków
 * i „struktura dni" pokazywała 35 dni w sierpniu.
 */
function classifyDay(
  day: IsoDate,
  worked: Set<IsoDate>,
  absences: Map<IsoDate, 'vacation' | 'sick' | 'dayOff'>,
): DayKind {
  if (worked.has(day)) return 'worked'
  const absence = absences.get(day)
  if (absence) return absence
  return isWeekend(day) ? 'weekend' : 'empty'
}

/* ── Godziny ──────────────────────────────────────────────────────────────── */

/**
 * `total` — wszystkie dni pon–pt okna (podstawa celu).
 * `open`  — te z nich, które są jeszcze przed nami i nie mają ani wpisu, ani
 *           nieobecności; tylko im dopisujemy normę do planu.
 */
function countBusinessDays(
  period: MonthMetricsInput['period'],
  today: IsoDate,
  entryDates: Set<IsoDate>,
  absenceDates: Set<IsoDate>,
): { total: number; open: number } {
  let total = 0
  let open = 0
  for (const day of eachDay(period)) {
    if (isWeekend(day)) continue
    total += 1
    if (day > today && !entryDates.has(day) && !absenceDates.has(day)) open += 1
  }
  return { total, open }
}

function buildHours(args: {
  settings: MetricsSettings
  businessDays: { total: number; open: number }
  actual: number
  plannedFromEntries: number
  realizedWorkedDays: number
}): HoursMetrics {
  const { settings, businessDays, actual, plannedFromEntries } = args

  const planned = roundHours(
    plannedFromEntries + businessDays.open * settings.dailyNormHours,
  )
  const goal =
    settings.hoursGoalMode === 'manual'
      ? settings.manualHoursGoal ?? 0
      : businessDays.total * settings.dailyNormHours

  return {
    actual,
    planned,
    forecast: roundHours(actual + planned),
    goal,
    goalProgress: goal > 0 ? actual / goal : 0,
    overtime: roundHours(Math.max(0, actual - goal)),
    avgPerWorkedDay:
      args.realizedWorkedDays > 0
        ? roundHours(actual / args.realizedWorkedDays)
        : null,
  }
}

/* ── Pieniądze ────────────────────────────────────────────────────────────── */

function buildEarnings(args: {
  actualMinor: Minor
  plannedMinor: Minor
  realized: WorkEntryInput[]
  realizedWorkedDays: number
  settings: MetricsSettings
}): EarningsMetrics {
  const { actualMinor, plannedMinor, realized, settings } = args

  const perDay = new Map<IsoDate, Minor>()
  for (const entry of realized) {
    const amount = entryAmountMinor(entry, settings)
    perDay.set(entry.date, (perDay.get(entry.date) ?? 0) + amount)
  }

  let bestDay: EarningsMetrics['bestDay'] = null
  for (const [date, amountMinor] of perDay) {
    if (amountMinor > 0 && (!bestDay || amountMinor > bestDay.amountMinor)) {
      bestDay = { date, amountMinor }
    }
  }

  const goalMinor = settings.earningsGoalMinor
  return {
    actualMinor,
    plannedMinor,
    forecastMinor: actualMinor + plannedMinor,
    goalMinor,
    goalProgress: goalMinor && goalMinor > 0 ? actualMinor / goalMinor : null,
    bestDay,
    avgPerWorkedDayMinor:
      args.realizedWorkedDays > 0
        ? Math.round(actualMinor / args.realizedWorkedDays)
        : null,
    currency: settings.displayCurrency,
  }
}

/**
 * Stawka efektywna = kwota / godziny, ale WYŁĄCZNIE z wpisów, które w ogóle
 * coś przyniosły. Poprzednia wersja na Pulpicie liczyła tylko klientów w EUR,
 * więc przy kliencie rozliczanym w złotówkach pokazywała „0,00 €/h · 0 klientów"
 * obok kilkunastu tysięcy przychodu.
 */
function buildEffectiveRate(
  realized: WorkEntryInput[],
  settings: MetricsSettings,
): Minor | null {
  let hours = 0
  let amount = 0
  for (const entry of realized) {
    const value = entryAmountMinor(entry, settings)
    if (value <= 0 || entry.hours <= 0) continue
    hours += entry.hours
    amount += value
  }
  return hours > 0 ? Math.round(amount / hours) : null
}

/* ── Serie ────────────────────────────────────────────────────────────────── */

/**
 * JEDNA definicja serii: kolejne dni kalendarzowe z wpisem, liczone wstecz od
 * `today` (albo od dnia poprzedniego, gdy dziś wpisu nie ma). Nieobecności
 * przeskakujemy albo przerywamy nimi serię — zależnie od ustawienia.
 *
 * Serie czytają CAŁĄ tablicę wpisów, nie tylko okno: seria nie kończy się
 * 1. dnia miesiąca. Dni po `today` nie liczą się nigdy — plan nie jest serią.
 */
function buildStreaks(
  entries: WorkEntryInput[],
  absences: MonthMetricsInput['absences'],
  today: IsoDate,
  absenceBreaksStreak: boolean,
): { currentStreakDays: number; longestStreakDays: number } {
  const worked = new Set(
    entries.filter(isRealized(today)).map((e) => e.date),
  )
  if (worked.size === 0) return { currentStreakDays: 0, longestStreakDays: 0 }

  const skippable = absenceBreaksStreak
    ? new Set<IsoDate>()
    : new Set(absences.filter((a) => a.date <= today).map((a) => a.date))

  const earliest = [...worked].reduce((min, d) => (d < min ? d : min))

  let current = 0
  let cursor = worked.has(today) ? today : addDays(today, -1)
  while (cursor >= earliest) {
    if (worked.has(cursor)) {
      current += 1
    } else if (!skippable.has(cursor)) {
      break
    }
    cursor = addDays(cursor, -1)
  }

  let longest = 0
  let running = 0
  for (let day = earliest; day <= today; day = addDays(day, 1)) {
    if (worked.has(day)) {
      running += 1
      longest = Math.max(longest, running)
    } else if (!skippable.has(day)) {
      running = 0
    }
  }

  return { currentStreakDays: current, longestStreakDays: longest }
}

/* ── Podziały ─────────────────────────────────────────────────────────────── */

/** Jeden podział godzin i kwot, dwa wymiary: projekt i klient. */
function groupBy<K extends string | null>(
  realized: WorkEntryInput[],
  settings: MetricsSettings,
  keyOf: (entry: WorkEntryInput) => K,
): Array<{ key: K; hours: number; amountMinor: Minor; shareOfMonth: number }> {
  const buckets = new Map<K, { hours: number; amountMinor: Minor }>()
  for (const entry of realized) {
    const key = keyOf(entry)
    const bucket = buckets.get(key) ?? { hours: 0, amountMinor: 0 }
    bucket.hours += entry.hours
    bucket.amountMinor += entryAmountMinor(entry, settings)
    buckets.set(key, bucket)
  }

  const totalHours = [...buckets.values()].reduce((sum, b) => sum + b.hours, 0)
  return [...buckets.entries()]
    .map(([key, bucket]) => ({
      key,
      hours: roundHours(bucket.hours),
      amountMinor: bucket.amountMinor,
      shareOfMonth: totalHours > 0 ? bucket.hours / totalHours : 0,
    }))
    .sort(
      (a, b) => b.hours - a.hours || String(a.key).localeCompare(String(b.key)),
    )
}

/** Kubełek na KAŻDY ISO-tydzień okna, także pusty — wykres ma pełną oś. */
function buildByWeek(
  from: IsoDate,
  to: IsoDate,
  realized: WorkEntryInput[],
  settings: MetricsSettings,
): MonthMetrics['byWeek'] {
  const buckets = new Map<string, { hours: number; amountMinor: Minor }>()
  for (const day of eachDay({ from, to, label: '' })) {
    const key = isoWeekKey(day)
    if (!buckets.has(key)) buckets.set(key, { hours: 0, amountMinor: 0 })
  }

  for (const entry of realized) {
    const bucket = buckets.get(isoWeekKey(entry.date))
    if (!bucket) continue
    bucket.hours += entry.hours
    bucket.amountMinor += entryAmountMinor(entry, settings)
  }

  return [...buckets.entries()].map(([isoWeek, bucket]) => ({
    isoWeek,
    hours: roundHours(bucket.hours),
    amountMinor: bucket.amountMinor,
  }))
}
