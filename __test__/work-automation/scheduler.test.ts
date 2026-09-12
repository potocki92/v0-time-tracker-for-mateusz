import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_WEEK_SCHEDULE } from '@/features/work-automation/domain'
import { upsertRunRecord } from '@/features/work-automation/services/workAutomation.repository.server'
import { runAutomationForUser } from '@/features/work-automation/services/workAutomation.runner.server'

import { createFakeSupabase, type Row } from './fakeSupabase'

/**
 * Zachowanie przy schedulerze chodzacym CO MINUTE (Supabase Cron,
 * `work-automation-minute-tick`).
 *
 * Pytanie tych testow nie brzmi „czy logika dziala" — to sprawdza
 * `runner.test.ts` — ale „czy 1440 wywolan na dobe zamiast 24 czegos nie psuje":
 * czy zapis nie wypada przed ustawiona godzina, czy kolejne ticki w tej samej
 * dobie nie dokladaja drugiego wpisu i czy dwa przebiegi naraz daja najwyzej
 * jeden wpis.
 *
 * Czas jest wstrzykiwany, wiec zaden scenariusz nie zalezy od zegara maszyny.
 */

const USER = 'user-a'
const CLIENT = 'client-a'

/** Wszystkie dni wlaczone — testy stref i DST nie maja potykac sie o niedziele. */
const ALL_DAYS = { ...DEFAULT_WEEK_SCHEDULE, sun: { enabled: true, hours: 8 } }

interface Scenario {
  /** Pierwszy dzien, ktory automat moze rozpatrzec — zarazem dolna granica okna. */
  startDate: string
  runTime: string
  timeZone: string
}

/**
 * Baza z jednym kontem. `startDate` celowo ustawiamy na rozpatrywany dzien:
 * okno nadrabiania zwieza sie wtedy do jednej daty i asercje mowia o niej,
 * a nie o przypadkowych zaleglosciach.
 */
function fakeFor({ startDate, runTime, timeZone }: Scenario) {
  const config: Row = {
    enabled: true,
    start_date: startDate,
    run_time: runTime,
    time_zone: timeZone,
    week_schedule: ALL_DAYS,
    client_id: CLIENT,
    project_id: null,
  }

  return createFakeSupabase({
    work_automation_settings: [{ user_id: USER, disabled_reason: null, ...config }],
    work_automation_setting_versions: [
      // Wersja obowiazuje od dnia przed aktywacja — inaczej dzien dostalby
      // `unknown_settings` zamiast decyzji.
      { id: 'v1', user_id: USER, effective_from: `${startDate}T00:00:00.000Z`, ...config },
    ],
    work_automation_resumptions: [],
    work_automation_runs: [],
    clients: [{ id: CLIENT, user_id: USER, name: 'Klient', work_type: 'hourly' }],
    projects: [],
    trips: [],
    work_entries: [],
  })
}

const asClient = (db: ReturnType<typeof fakeFor>) => db as unknown as SupabaseClient
const datesOf = (db: ReturnType<typeof fakeFor>) =>
  db.rows('work_entries').map((row) => row.date as string)

describe('tick co minute — prog godziny zapisu', () => {
  /** runTime 17:00 w Europe/Berlin (CEST, UTC+2) 8 wrzesnia 2026. */
  const scenario: Scenario = {
    startDate: '2026-09-08',
    runTime: '17:00',
    timeZone: 'Europe/Berlin',
  }

  it('16:59 — za wczesnie, zaden tick nie zapisuje nic', async () => {
    const db = fakeFor(scenario)

    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T14:59:00Z') })

    expect(db.rows('work_entries')).toHaveLength(0)
    // Brak wpisu to NIE decyzja: dzien zostaje otwarty na kolejne ticki.
    expect(db.rows('work_automation_runs')).toHaveLength(0)
  })

  it('17:00 — termin osiagniety, powstaje wpis', async () => {
    const db = fakeFor(scenario)

    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T15:00:00Z') })

    expect(datesOf(db)).toEqual(['2026-09-08'])
  })

  it('17:01 — zapis nadal powstaje, jesli tick o 17:00 nie doszedl', async () => {
    const db = fakeFor(scenario)

    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T15:01:00Z') })

    expect(datesOf(db)).toEqual(['2026-09-08'])
  })

  it('17:01 i 17:02 po zapisie — dzien rozstrzygniety, zadnego drugiego wpisu', async () => {
    const db = fakeFor(scenario)

    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T15:00:00Z') })
    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T15:01:00Z') })
    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T15:02:00Z') })

    expect(datesOf(db)).toEqual(['2026-09-08'])
    expect(db.rows('work_automation_runs')).toHaveLength(1)
  })
})

describe('tick co minute — strefa uzytkownika, nie serwera', () => {
  // Scheduler chodzi w UTC i nic o strefach nie wie. To `zonedParts` + `isDue`
  // decyduja, czy lokalna 17:00 juz byla — dlatego ten sam runTime wypada
  // w innej chwili UTC w kazdej strefie.
  const cases = [
    { timeZone: 'Europe/Warsaw', tooEarly: '2026-09-08T14:59:00Z', due: '2026-09-08T15:00:00Z' },
    { timeZone: 'Europe/Berlin', tooEarly: '2026-09-08T14:59:00Z', due: '2026-09-08T15:00:00Z' },
    { timeZone: 'Europe/London', tooEarly: '2026-09-08T15:59:00Z', due: '2026-09-08T16:00:00Z' },
  ]

  for (const { timeZone, tooEarly, due } of cases) {
    it(`${timeZone}: zapis dopiero po lokalnej 17:00`, async () => {
      const scenario: Scenario = { startDate: '2026-09-08', runTime: '17:00', timeZone }

      const early = fakeFor(scenario)
      await runAutomationForUser(asClient(early), USER, { now: new Date(tooEarly) })
      expect(datesOf(early)).toEqual([])

      const onTime = fakeFor(scenario)
      await runAutomationForUser(asClient(onTime), USER, { now: new Date(due) })
      expect(datesOf(onTime)).toEqual(['2026-09-08'])
    })
  }

  it('tick minute po polnocy zapisuje godziny pod wlasciwa lokalna date', async () => {
    // runTime 23:59, tick o 00:00 czasu berlinskiego 9 wrzesnia. Dzien 8 jest
    // zalegly (data < dzisiaj), dzien 9 jeszcze nie osiagnal progu.
    const db = fakeFor({ startDate: '2026-09-08', runTime: '23:59', timeZone: 'Europe/Berlin' })

    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T22:00:00Z') })

    expect(datesOf(db)).toEqual(['2026-09-08'])
  })
})

describe('tick co minute — zmiana czasu', () => {
  it('wiosna: godzina, ktora nie istnieje, nie blokuje zapisu', async () => {
    // 29 marca 2026 Europe/Berlin przeskakuje z 02:00 CET na 03:00 CEST,
    // wiec scienna 02:30 nie istnieje. Przed przeskokiem (01:59 CET) zapisu
    // byc nie moze; pierwszy tick po nim (03:00 CEST) juz tak.
    const scenario: Scenario = {
      startDate: '2026-03-29',
      runTime: '02:30',
      timeZone: 'Europe/Berlin',
    }

    const before = fakeFor(scenario)
    await runAutomationForUser(asClient(before), USER, { now: new Date('2026-03-29T00:59:00Z') })
    expect(datesOf(before)).toEqual([])

    const after = fakeFor(scenario)
    await runAutomationForUser(asClient(after), USER, { now: new Date('2026-03-29T01:00:00Z') })
    expect(datesOf(after)).toEqual(['2026-03-29'])
  })

  it('jesien: powtorzona godzina i 60 ticków pozniej — nadal jeden wpis', async () => {
    // 25 pazdziernika 2026 scienna 02:30 wypada dwa razy (CEST, potem CET).
    const db = fakeFor({ startDate: '2026-10-25', runTime: '02:30', timeZone: 'Europe/Berlin' })

    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-10-25T00:30:00Z') })
    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-10-25T01:30:00Z') })

    expect(datesOf(db)).toEqual(['2026-10-25'])
  })
})

describe('tick co minute — dwa przebiegi naraz', () => {
  it('reczne uruchomienie rownolegle z tickiem daje najwyzej jeden wpis', async () => {
    const db = fakeFor({ startDate: '2026-09-08', runTime: '17:00', timeZone: 'Europe/Berlin' })
    const now = new Date('2026-09-08T15:00:00Z')

    // Oba przebiegi czytaja dziennik, zanim ktorykolwiek cokolwiek zapisze —
    // czyli dokladnie sytuacja „cron + workflow_dispatch w tej samej sekundzie".
    await Promise.all([
      runAutomationForUser(asClient(db), USER, { now }),
      runAutomationForUser(asClient(db), USER, { now }),
    ])

    expect(datesOf(db)).toEqual(['2026-09-08'])

    // Dziennik musi pokazywac to, co sie NAPRAWDE stalo: wpis zostal utworzony.
    // Przegrany przebieg nie ma prawa podmienic tego na „wpis juz istnial".
    const runs = db.rows('work_automation_runs')
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ outcome: 'created', reason: 'created', hours: 10 })
    expect(runs[0].entry_id).toBeTruthy()
  })
})

describe('upsertRunRecord — ostateczna decyzja jest nienaruszalna', () => {
  const decision = {
    localDate: '2026-09-08',
    outcome: 'skipped' as const,
    reason: 'entry_exists' as const,
    hours: null,
    entryId: null,
    configVersionId: 'v1',
  }

  it('nie nadpisuje rozstrzygnietego dnia wynikiem rownoleglego przebiegu', async () => {
    const db = createFakeSupabase({
      work_automation_runs: [
        {
          user_id: USER,
          local_date: '2026-09-08',
          outcome: 'created',
          reason: 'created',
          hours: 10,
          entry_id: 'entry-1',
          config_version_id: 'v1',
        },
      ],
    })

    await upsertRunRecord(asClient(db), USER, decision)

    expect(db.rows('work_automation_runs')).toHaveLength(1)
    expect(db.rows('work_automation_runs')[0]).toMatchObject({
      outcome: 'created',
      entry_id: 'entry-1',
    })
  })

  it('nadpisuje wiersz z bledem, bo blad jest ponawialny', async () => {
    const db = createFakeSupabase({
      work_automation_runs: [
        {
          user_id: USER,
          local_date: '2026-09-08',
          outcome: 'error',
          reason: 'insert_failed',
          hours: null,
          entry_id: null,
          config_version_id: 'v1',
        },
      ],
    })

    await upsertRunRecord(asClient(db), USER, { ...decision, outcome: 'created', reason: 'created' })

    expect(db.rows('work_automation_runs')[0]).toMatchObject({
      outcome: 'created',
      reason: 'created',
    })
  })
})
