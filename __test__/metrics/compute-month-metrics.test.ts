import { describe, expect, it } from 'vitest'
import { computeMonthMetrics } from '@/lib/metrics/computeMonthMetrics'
import { eachDay, isoWeekKey, monthPeriod } from '@/lib/metrics/period'
import type {
  AbsenceInput,
  MetricsSettings,
  MonthMetricsInput,
  WorkEntryInput,
} from '@/lib/metrics/types'

/**
 * Sierpień 2026: 31 dni, 21 dni roboczych, 10 dni weekendu.
 * "Dziś" = 22.08.2026 (sobota) — ta sama data, co na zrzutach z bugiem.
 */
const AUG = monthPeriod(2026, 7)
const TODAY = '2026-08-22'

function entry(over: Partial<WorkEntryInput> & { date: string }): WorkEntryInput {
  return {
    hours: 8,
    projectId: 'p1',
    clientId: 'c1',
    rateMinor: 10_000, // 100,00 PLN/h
    amountMinor: null,
    currency: 'PLN',
    kind: 'real',
    ...over,
  }
}

function settings(over: Partial<MetricsSettings> = {}): MetricsSettings {
  return {
    dailyNormHours: 8,
    hoursGoalMode: 'businessDays',
    manualHoursGoal: null,
    earningsGoalMinor: null,
    displayCurrency: 'PLN',
    absenceBreaksStreak: false,
    eurRateBps: 43_000, // 4,30 zł za 1 €
    ...over,
  }
}

function input(over: Partial<MonthMetricsInput> = {}): MonthMetricsInput {
  return {
    period: AUG,
    today: TODAY,
    entries: [],
    absences: [],
    settings: settings(),
    ...over,
  }
}

describe('computeMonthMetrics — struktura dni', () => {
  it('suma pól DayBreakdown zawsze równa się liczbie dni okna', () => {
    const days = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03' }),
          entry({ date: '2026-08-04' }),
          entry({ date: '2026-08-08' }), // sobota
          entry({ date: '2026-08-15' }), // sobota
          entry({ date: '2026-08-25', kind: 'predicted' }),
        ],
        absences: [
          { date: '2026-08-05', kind: 'vacation' },
          { date: '2026-08-06', kind: 'sick' },
          { date: '2026-08-07', kind: 'dayOff' },
        ],
      }),
    ).days

    const sum =
      days.worked +
      days.vacation +
      days.sick +
      days.dayOff +
      days.weekendIdle +
      days.weekdayIdle

    expect(days.totalDays).toBe(31)
    expect(sum).toBe(31)
  })

  it('weekend z wpisem liczy się jako worked, nie jako weekendIdle', () => {
    const days = computeMonthMetrics(
      input({ entries: [entry({ date: '2026-08-08' })] }),
    ).days

    expect(days.worked).toBe(1)
    expect(days.weekendIdle).toBe(9)
    expect(days.weekdayIdle).toBe(21)
    expect(days.totalDays).toBe(31)
  })

  it('pusty miesiąc to 21 dni roboczych i 10 weekendowych', () => {
    const days = computeMonthMetrics(input()).days

    expect(days).toEqual({
      totalDays: 31,
      worked: 0,
      vacation: 0,
      sick: 0,
      dayOff: 0,
      weekendIdle: 10,
      weekdayIdle: 21,
    })
  })

  it('rozdziela dni pracy na potwierdzone i zaplanowane', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03' }),
          entry({ date: '2026-08-04' }),
          entry({ date: '2026-08-25', kind: 'predicted' }),
        ],
      }),
    )

    expect(metrics.days.worked).toBe(3)
    expect(metrics.realizedWorkedDays).toBe(2)
    // 25.08 z wpisu + pięć pustych dni roboczych po dziś (24, 26, 27, 28, 31)
    expect(metrics.plannedDays).toBe(6)
  })

  it('wpis ma pierwszeństwo przed nieobecnością tego samego dnia', () => {
    const days = computeMonthMetrics(
      input({
        entries: [entry({ date: '2026-08-05' })],
        absences: [{ date: '2026-08-05', kind: 'vacation' }],
      }),
    ).days

    expect(days.worked).toBe(1)
    expect(days.vacation).toBe(0)
    expect(days.weekdayIdle).toBe(20)
  })
})

describe('computeMonthMetrics — godziny', () => {
  it('actual liczy tylko wpisy real do dziś włącznie', () => {
    const { hours } = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8 }),
          entry({ date: '2026-08-04', hours: 7.5 }),
          entry({ date: '2026-08-20', hours: 6, kind: 'predicted' }), // przeszłość, ale plan
          entry({ date: '2026-08-25', hours: 8 }), // przyszłość
        ],
      }),
    )

    expect(hours.actual).toBe(15.5)
  })

  it('planned = godziny z planu + puste dni robocze po dziś × norma', () => {
    const { hours } = computeMonthMetrics(
      input({
        entries: [entry({ date: '2026-08-25', hours: 10, kind: 'predicted' })],
      }),
    )

    // Dni robocze po 22.08: 24, 25, 26, 27, 28, 31. Dzień 25 ma już wpis,
    // więc normę dopisujemy pozostałym pięciu.
    expect(hours.planned).toBe(10 + 5 * 8)
    expect(hours.forecast).toBe(hours.actual + hours.planned)
  })

  it('nie dopisuje normy dniom, na które wzięto urlop', () => {
    const { hours } = computeMonthMetrics(
      input({ absences: [{ date: '2026-08-24', kind: 'vacation' }] }),
    )

    expect(hours.planned).toBe(5 * 8)
  })

  it('cel w trybie businessDays to dni robocze okna × norma', () => {
    expect(computeMonthMetrics(input()).hours.goal).toBe(21 * 8)
  })

  it('cel w trybie manual bierze stałą wartość', () => {
    const { hours } = computeMonthMetrics(
      input({ settings: settings({ hoursGoalMode: 'manual', manualHoursGoal: 160 }) }),
    )

    expect(hours.goal).toBe(160)
  })

  it('goalProgress nie jest przycinany do 100%', () => {
    const { hours } = computeMonthMetrics(
      input({
        entries: [entry({ date: '2026-08-03', hours: 160 })],
        settings: settings({ hoursGoalMode: 'manual', manualHoursGoal: 100 }),
      }),
    )

    expect(hours.goalProgress).toBeCloseTo(1.6, 10)
    expect(hours.overtime).toBe(60)
  })

  it('avgPerWorkedDay dzieli przez zrealizowane dni pracy, a nie przez days.worked', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8 }),
          entry({ date: '2026-08-04', hours: 6 }),
          entry({ date: '2026-08-25', hours: 8, kind: 'predicted' }),
        ],
      }),
    )

    expect(metrics.days.worked).toBe(3)
    expect(metrics.hours.avgPerWorkedDay).toBe(7)
  })

  it('avgPerWorkedDay jest null, gdy nie ma zrealizowanych dni', () => {
    expect(computeMonthMetrics(input()).hours.avgPerWorkedDay).toBeNull()
  })

  it('wpis real wypiera wpis predicted z tego samego dnia', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8 }),
          entry({ date: '2026-08-03', hours: 6, kind: 'predicted' }),
        ],
      }),
    )

    expect(metrics.hours.actual).toBe(8)
    expect(metrics.hours.planned).toBe(6 * 8) // sama norma, bez zdublowanego dnia
    expect(metrics.days.worked).toBe(1)
  })

  it('ignoruje wpisy spoza okna', () => {
    const { hours } = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-07-31', hours: 100 }),
          entry({ date: '2026-09-01', hours: 100 }),
          entry({ date: '2026-08-03', hours: 8 }),
        ],
      }),
    )

    expect(hours.actual).toBe(8)
  })
})

describe('computeMonthMetrics — pieniądze', () => {
  it('sumuje kwoty w walucie wyświetlania', () => {
    const { earnings } = computeMonthMetrics(
      input({ entries: [entry({ date: '2026-08-03', hours: 8, rateMinor: 10_000 })] }),
    )

    expect(earnings.actualMinor).toBe(80_000) // 800,00 zł
    expect(earnings.currency).toBe('PLN')
  })

  it('przelicza EUR na PLN kursem z ustawień', () => {
    const { earnings } = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8, rateMinor: 3_000, currency: 'EUR' }),
        ],
      }),
    )

    // 8 h × 30,00 € = 240,00 € × 4,30 = 1032,00 zł
    expect(earnings.actualMinor).toBe(103_200)
  })

  it('przelicza PLN na EUR, gdy walutą wyświetlania jest EUR', () => {
    const { earnings } = computeMonthMetrics(
      input({
        entries: [entry({ date: '2026-08-03', hours: 1, rateMinor: 43_000 })],
        settings: settings({ displayCurrency: 'EUR' }),
      }),
    )

    expect(earnings.actualMinor).toBe(10_000) // 430,00 zł = 100,00 €
    expect(earnings.currency).toBe('EUR')
  })

  it('amountMinor ma pierwszeństwo przed rateMinor × hours (akord)', () => {
    const { earnings } = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8, rateMinor: null, amountMinor: 55_000 }),
        ],
      }),
    )

    expect(earnings.actualMinor).toBe(55_000)
  })

  it('rozdziela kwoty zrealizowane od zaplanowanych', () => {
    const { earnings } = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8 }),
          entry({ date: '2026-08-25', hours: 8 }),
        ],
      }),
    )

    expect(earnings.actualMinor).toBe(80_000)
    expect(earnings.plannedMinor).toBe(80_000)
    expect(earnings.forecastMinor).toBe(160_000)
  })

  it('bestDay sumuje wpisy z tego samego dnia i wybiera największy', () => {
    const { earnings } = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 4 }),
          entry({ date: '2026-08-03', hours: 4, projectId: 'p2' }),
          entry({ date: '2026-08-04', hours: 7 }),
        ],
      }),
    )

    expect(earnings.bestDay).toEqual({ date: '2026-08-03', amountMinor: 80_000 })
  })

  it('bestDay jest null, gdy nie ma zarobków', () => {
    expect(computeMonthMetrics(input()).earnings.bestDay).toBeNull()
  })

  it('goalProgress kwotowy jest null bez celu', () => {
    const { earnings } = computeMonthMetrics(input())

    expect(earnings.goalMinor).toBeNull()
    expect(earnings.goalProgress).toBeNull()
  })

  it('goalProgress kwotowy liczy się względem celu', () => {
    const { earnings } = computeMonthMetrics(
      input({
        entries: [entry({ date: '2026-08-03', hours: 8 })],
        settings: settings({ earningsGoalMinor: 160_000 }),
      }),
    )

    expect(earnings.goalProgress).toBeCloseTo(0.5, 10)
  })
})

describe('computeMonthMetrics — stawka efektywna', () => {
  it('liczy stawkę także dla klientów rozliczanych w PLN', () => {
    const metrics = computeMonthMetrics(
      input({ entries: [entry({ date: '2026-08-03', hours: 10, rateMinor: 10_000 })] }),
    )

    expect(metrics.effectiveRateMinorPerHour).toBe(10_000)
  })

  it('jest null, gdy nie ma godzin rozliczalnych', () => {
    const metrics = computeMonthMetrics(
      input({ entries: [entry({ date: '2026-08-03', hours: 8, rateMinor: 0 })] }),
    )

    expect(metrics.effectiveRateMinorPerHour).toBeNull()
  })

  it('uśrednia stawkę po walutach po przeliczeniu na walutę wyświetlania', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 1, rateMinor: 10_000 }), // 100,00 zł
          entry({ date: '2026-08-04', hours: 1, rateMinor: 10_000, currency: 'EUR' }), // 430,00 zł
        ],
      }),
    )

    expect(metrics.effectiveRateMinorPerHour).toBe(26_500) // (100 + 430) / 2
  })

  it('pomija godziny akordowe bez kwoty', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 5, rateMinor: 10_000 }),
          entry({ date: '2026-08-04', hours: 5, rateMinor: null, amountMinor: null }),
        ],
      }),
    )

    expect(metrics.effectiveRateMinorPerHour).toBe(10_000)
  })
})

describe('computeMonthMetrics — serie', () => {
  const weekEntries = [
    entry({ date: '2026-08-17' }),
    entry({ date: '2026-08-18' }),
    entry({ date: '2026-08-19' }),
    entry({ date: '2026-08-20' }),
    entry({ date: '2026-08-21' }),
  ]

  it('liczy kolejne dni z wpisem wstecz od dziś', () => {
    const metrics = computeMonthMetrics(
      input({ entries: [...weekEntries, entry({ date: TODAY })] }),
    )

    expect(metrics.currentStreakDays).toBe(6)
  })

  it('gdy dziś nie ma wpisu, liczy od dnia poprzedniego', () => {
    const metrics = computeMonthMetrics(input({ entries: weekEntries }))

    expect(metrics.currentStreakDays).toBe(5)
  })

  it('nie liczy wpisów zaplanowanych', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-20' }),
          entry({ date: '2026-08-21', kind: 'predicted' }),
        ],
      }),
    )

    expect(metrics.currentStreakDays).toBe(0)
  })

  it('nieobecność nie przerywa serii, gdy absenceBreaksStreak=false', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: weekEntries.filter((e) => e.date !== '2026-08-19'),
        absences: [{ date: '2026-08-19', kind: 'vacation' }],
      }),
    )

    expect(metrics.currentStreakDays).toBe(4)
  })

  it('nieobecność przerywa serię, gdy absenceBreaksStreak=true', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: weekEntries.filter((e) => e.date !== '2026-08-19'),
        absences: [{ date: '2026-08-19', kind: 'vacation' }],
        settings: settings({ absenceBreaksStreak: true }),
      }),
    )

    expect(metrics.currentStreakDays).toBe(2)
  })

  it('seria przechodzi przez granicę miesiąca', () => {
    const metrics = computeMonthMetrics(
      input({
        today: '2026-08-03',
        entries: [
          entry({ date: '2026-07-31' }),
          entry({ date: '2026-08-01' }),
          entry({ date: '2026-08-02' }),
          entry({ date: '2026-08-03' }),
        ],
      }),
    )

    expect(metrics.currentStreakDays).toBe(4)
  })

  it('longestStreakDays znajduje najdłuższą serię w podanych wpisach', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03' }),
          entry({ date: '2026-08-04' }),
          entry({ date: '2026-08-05' }),
          entry({ date: '2026-08-06' }),
          entry({ date: '2026-08-07' }),
          entry({ date: '2026-08-08' }),
          entry({ date: '2026-08-20' }),
          entry({ date: '2026-08-21' }),
        ],
      }),
    )

    expect(metrics.longestStreakDays).toBe(6)
    expect(metrics.currentStreakDays).toBe(2)
  })

  it('bez wpisów obie serie są zerowe', () => {
    const metrics = computeMonthMetrics(input())

    expect(metrics.currentStreakDays).toBe(0)
    expect(metrics.longestStreakDays).toBe(0)
  })
})

describe('computeMonthMetrics — podziały', () => {
  it('byProject sumuje godziny i udziały do całości', () => {
    const { byProject } = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8, projectId: 'p1' }),
          entry({ date: '2026-08-04', hours: 8, projectId: 'p1' }),
          entry({ date: '2026-08-05', hours: 4, projectId: 'p2' }),
        ],
      }),
    )

    expect(byProject).toEqual([
      { projectId: 'p1', hours: 16, amountMinor: 160_000, shareOfMonth: 0.8 },
      { projectId: 'p2', hours: 4, amountMinor: 40_000, shareOfMonth: 0.2 },
    ])
  })

  it('byClient dzieli te same godziny po kliencie', () => {
    const { byClient } = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8, clientId: 'c1', projectId: 'p1' }),
          entry({ date: '2026-08-04', hours: 8, clientId: 'c1', projectId: 'p2' }),
          entry({ date: '2026-08-05', hours: 4, clientId: null, projectId: 'p3' }),
        ],
      }),
    )

    expect(byClient).toEqual([
      { clientId: 'c1', hours: 16, amountMinor: 160_000, shareOfMonth: 0.8 },
      { clientId: null, hours: 4, amountMinor: 40_000, shareOfMonth: 0.2 },
    ])
  })

  it('byWeek pokrywa wszystkie ISO-tygodnie okna i sumuje się do hours.actual', () => {
    const metrics = computeMonthMetrics(
      input({
        entries: [
          entry({ date: '2026-08-03', hours: 8 }),
          entry({ date: '2026-08-17', hours: 6 }),
        ],
      }),
    )

    const expectedWeeks = [...new Set(eachDay(AUG).map(isoWeekKey))]
    expect(metrics.byWeek.map((w) => w.isoWeek)).toEqual(expectedWeeks)
    expect(metrics.byWeek.reduce((sum, w) => sum + w.hours, 0)).toBe(
      metrics.hours.actual,
    )
  })
})

describe('computeMonthMetrics — okno inne niż miesiąc', () => {
  it('liczy tydzień tak samo jak miesiąc', () => {
    const metrics = computeMonthMetrics(
      input({
        period: { from: '2026-08-17', to: '2026-08-23', label: 'Obecny tydzień' },
        entries: [
          entry({ date: '2026-08-17', hours: 8 }),
          entry({ date: '2026-08-03', hours: 8 }), // poza oknem
        ],
      }),
    )

    expect(metrics.days.totalDays).toBe(7)
    expect(metrics.hours.goal).toBe(5 * 8)
    expect(metrics.hours.actual).toBe(8)
    expect(metrics.period.label).toBe('Obecny tydzień')
  })

  it('okno w całości w przeszłości nie ma godzin planowanych z normy', () => {
    const metrics = computeMonthMetrics(
      input({
        period: monthPeriod(2026, 6),
        entries: [entry({ date: '2026-07-01', hours: 8 })],
      }),
    )

    expect(metrics.hours.planned).toBe(0)
    expect(metrics.hours.actual).toBe(8)
  })
})

describe('computeMonthMetrics — czystość', () => {
  it('jest deterministyczne dla tego samego wejścia', () => {
    const args = input({
      entries: [entry({ date: '2026-08-03' }), entry({ date: '2026-08-25' })],
      absences: [{ date: '2026-08-05', kind: 'sick' } satisfies AbsenceInput],
    })

    expect(computeMonthMetrics(args)).toEqual(computeMonthMetrics(args))
  })

  it('nie mutuje wejścia', () => {
    const entries = [entry({ date: '2026-08-04' }), entry({ date: '2026-08-03' })]
    const snapshot = JSON.stringify(entries)

    computeMonthMetrics(input({ entries }))

    expect(JSON.stringify(entries)).toBe(snapshot)
  })
})
