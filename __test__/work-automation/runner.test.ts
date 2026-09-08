import { beforeEach, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_WEEK_SCHEDULE, MAX_CATCHUP_DAYS } from '@/features/work-automation/domain'
import {
  runAutomationForUser,
  runWorkAutomation,
} from '@/features/work-automation/services/workAutomation.runner.server'

import { createFakeSupabase, type FakeOptions, type Row } from './fakeSupabase'

/**
 * Zachowanie przebiegu zadania: co powstaje, co jest pomijane i dlaczego.
 * Czas jest wstrzykiwany, wiec kazdy scenariusz jest deterministyczny.
 */

const USER = 'user-a'
const OTHER_USER = 'user-b'
const CLIENT = 'client-a'
const TZ = 'Europe/Warsaw'

const ALL_DAYS = {
  ...DEFAULT_WEEK_SCHEDULE,
  sun: { enabled: true, hours: 8 },
}

/** 20:00 czasu polskiego 8 wrzesnia 2026 (wtorek) — po godzinie zapisu 19:00. */
const NOW = new Date('2026-09-08T18:00:00Z')

function settings(overrides: Row = {}, userId = USER): Row {
  return {
    user_id: userId,
    enabled: true,
    start_date: '2026-09-01',
    run_time: '19:00',
    time_zone: TZ,
    week_schedule: DEFAULT_WEEK_SCHEDULE,
    client_id: CLIENT,
    project_id: null,
    disabled_reason: null,
    ...overrides,
  }
}

function version(overrides: Row = {}, userId = USER): Row {
  return {
    id: 'v1',
    user_id: userId,
    effective_from: '2026-08-31T00:00:00.000Z',
    enabled: true,
    start_date: '2026-09-01',
    run_time: '19:00',
    time_zone: TZ,
    week_schedule: DEFAULT_WEEK_SCHEDULE,
    client_id: CLIENT,
    project_id: null,
    ...overrides,
  }
}

function client(overrides: Row = {}, userId = USER): Row {
  return { id: CLIENT, user_id: userId, name: 'Klient', work_type: 'hourly', ...overrides }
}

function fake(seed: Record<string, Row[]> = {}, options?: FakeOptions) {
  return createFakeSupabase(
    {
      work_automation_settings: [settings()],
      work_automation_setting_versions: [version()],
      work_automation_resumptions: [],
      work_automation_runs: [],
      clients: [client()],
      projects: [],
      trips: [],
      work_entries: [],
      ...seed,
    },
    options,
  )
}

const asClient = (db: ReturnType<typeof fake>) => db as unknown as SupabaseClient

const datesOf = (rows: Row[]) => rows.map((row) => row.date).sort()
const runFor = (rows: Row[], date: string) => rows.find((row) => row.local_date === date)

describe('runAutomationForUser — nadrabianie od daty uruchomienia', () => {
  let db: ReturnType<typeof fake>

  beforeEach(async () => {
    db = fake()
    await runAutomationForUser(asClient(db), USER, { now: NOW })
  })

  it('zapisuje dni od aktywacji do dzisiaj, z pominieciem wylaczonej niedzieli', () => {
    expect(datesOf(db.rows('work_entries'))).toEqual([
      '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
      '2026-09-05', '2026-09-07', '2026-09-08',
    ])
    expect(runFor(db.rows('work_automation_runs'), '2026-09-06')).toMatchObject({
      outcome: 'skipped',
      reason: 'weekday_off',
    })
  })

  it('tworzy wpisy rzeczywiste ze zrodlem `automation` i godzinami z grafiku', () => {
    const entry = db.rows('work_entries').find((row) => row.date === '2026-09-08')
    expect(entry).toMatchObject({
      user_id: USER,
      status: 'worked',
      entry_kind: 'real',
      source: 'automation',
      hours: 10,
      client_id: CLIENT,
      project_id: null,
    })
  })

  it('zapisuje jeden wiersz dziennika na dzien, z odniesieniem do wersji konfiguracji', () => {
    const runs = db.rows('work_automation_runs')
    expect(runs).toHaveLength(8)
    expect(runFor(runs, '2026-09-08')).toMatchObject({
      outcome: 'created',
      reason: 'created',
      config_version_id: 'v1',
    })
  })
})

describe('runAutomationForUser — godzina zapisu', () => {
  it('nie zapisuje dzisiejszego dnia przed ustawiona godzina', async () => {
    const db = fake()
    // 17:00 czasu polskiego — przed 19:00.
    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T15:00:00Z') })

    expect(datesOf(db.rows('work_entries'))).not.toContain('2026-09-08')
  })

  it('przebieg po polnocy przypisuje godziny do wlasciwego dnia', async () => {
    const db = fake()
    // 00:30 czasu polskiego 9 wrzesnia — 9. jeszcze nie jest wymagalny.
    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-09-08T22:30:00Z') })

    const dates = datesOf(db.rows('work_entries'))
    expect(dates).toContain('2026-09-08')
    expect(dates).not.toContain('2026-09-09')
  })

  it('jesienna powtorzona godzina daje najwyzej jeden wpis', async () => {
    const seeded = {
      work_automation_settings: [
        settings({ start_date: '2026-10-25', run_time: '02:00', week_schedule: ALL_DAYS }),
      ],
      work_automation_setting_versions: [
        version({
          effective_from: '2026-10-24T00:00:00.000Z',
          start_date: '2026-10-25',
          run_time: '02:00',
          week_schedule: ALL_DAYS,
        }),
      ],
    }
    const db = fake(seeded)

    // 02:30 czasu letniego, a potem 02:30 czasu zimowego — ta sama godzina scienna.
    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-10-25T00:30:00Z') })
    await runAutomationForUser(asClient(db), USER, { now: new Date('2026-10-25T01:30:00Z') })

    expect(datesOf(db.rows('work_entries'))).toEqual(['2026-10-25'])
  })
})

describe('runAutomationForUser — pierwszenstwo decyzji uzytkownika', () => {
  it('nie nadpisuje istniejacego wpisu rzeczywistego', async () => {
    const db = fake({
      work_entries: [
        { id: 'manual-1', user_id: USER, date: '2026-09-08', status: 'vacation', entry_kind: 'real', hours: null },
      ],
    })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    const forDate = db.rows('work_entries').filter((row) => row.date === '2026-09-08')
    expect(forDate).toHaveLength(1)
    expect(forDate[0]).toMatchObject({ id: 'manual-1', status: 'vacation' })
    expect(runFor(db.rows('work_automation_runs'), '2026-09-08')).toMatchObject({
      outcome: 'skipped',
      reason: 'entry_exists',
    })
  })

  it('dla dnia z samym planem tworzy wpis rzeczywisty obok planu', async () => {
    const db = fake({
      work_entries: [
        { id: 'plan-1', user_id: USER, date: '2026-09-08', status: 'worked', entry_kind: 'predicted', hours: 12 },
      ],
    })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    const forDate = db.rows('work_entries').filter((row) => row.date === '2026-09-08')
    expect(forDate.map((row) => row.entry_kind).sort()).toEqual(['predicted', 'real'])
  })

  it('recznie usunietego wpisu automatycznego nie odtwarza', async () => {
    const db = fake()
    await runAutomationForUser(asClient(db), USER, { now: NOW })

    const entries = db.rows('work_entries')
    const index = entries.findIndex((row) => row.date === '2026-09-08')
    entries.splice(index, 1)

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(datesOf(db.rows('work_entries'))).not.toContain('2026-09-08')
  })

  it('reczna korekta godzin przetrwa ponowne uruchomienie', async () => {
    const db = fake()
    await runAutomationForUser(asClient(db), USER, { now: NOW })

    const entry = db.rows('work_entries').find((row) => row.date === '2026-09-08')!
    entry.hours = 6

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(db.rows('work_entries').find((row) => row.date === '2026-09-08')?.hours).toBe(6)
  })
})

describe('runAutomationForUser — idempotencja i rownolegle przebiegi', () => {
  it('ponowione wykonanie nie mnozy wpisow ani wierszy historii', async () => {
    const db = fake()

    const first = await runAutomationForUser(asClient(db), USER, { now: NOW })
    const second = await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(first.created).toBe(7)
    expect(second.created).toBe(0)
    expect(db.rows('work_entries')).toHaveLength(7)
    expect(db.rows('work_automation_runs')).toHaveLength(8)
  })

  it('konflikt z wpisem powstalym w drugim przebiegu oznacza pominiecie, nie nadpisanie', async () => {
    const db = fake()
    await runAutomationForUser(asClient(db), USER, { now: NOW })

    // Symulacja rownoleglego przebiegu: dziennik jeszcze nie zna decyzji,
    // ale wpis juz jest w bazie.
    const runs = db.rows('work_automation_runs')
    runs.splice(runs.findIndex((row) => row.local_date === '2026-09-08'), 1)

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(db.rows('work_entries').filter((row) => row.date === '2026-09-08')).toHaveLength(1)
    expect(runFor(db.rows('work_automation_runs'), '2026-09-08')).toMatchObject({
      outcome: 'skipped',
      reason: 'entry_exists',
    })
  })

  it('ogranicza liczbe nadrabianych dni w jednym przebiegu', async () => {
    const db = fake({
      work_automation_settings: [settings({ start_date: '2026-01-01' })],
      work_automation_setting_versions: [
        version({ effective_from: '2025-12-31T00:00:00.000Z', start_date: '2026-01-01' }),
      ],
    })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    const runs = db.rows('work_automation_runs')
    expect(runs).toHaveLength(MAX_CATCHUP_DAYS)
    expect(runs.map((row) => String(row.local_date)).sort()[0]).toBe('2026-08-26')
  })
})

describe('runAutomationForUser — historia ustawien', () => {
  it('nie uzupelnia okresu swiadomego wylaczenia', async () => {
    const db = fake({
      work_automation_setting_versions: [
        version(),
        version({ id: 'v2', effective_from: '2026-09-03T00:00:00.000Z', enabled: false }),
        version({ id: 'v3', effective_from: '2026-09-06T00:00:00.000Z' }),
      ],
    })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(datesOf(db.rows('work_entries'))).toEqual([
      '2026-09-01', '2026-09-02', '2026-09-07', '2026-09-08',
    ])
    expect(runFor(db.rows('work_automation_runs'), '2026-09-04')).toMatchObject({
      outcome: 'skipped',
      reason: 'automation_disabled',
    })
  })

  it('nie stosuje dzisiejszych ustawien do dni bez znanej historii', async () => {
    const db = fake({
      work_automation_setting_versions: [
        version({ effective_from: '2026-09-05T00:00:00.000Z' }),
      ],
    })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(runFor(db.rows('work_automation_runs'), '2026-09-02')).toMatchObject({
      outcome: 'skipped',
      reason: 'unknown_settings',
    })
    expect(datesOf(db.rows('work_entries'))).toEqual(['2026-09-05', '2026-09-07', '2026-09-08'])
  })

  it('wylaczony automat nie robi nic, mimo wpisu w tabeli', async () => {
    const db = fake({ work_automation_settings: [settings({ enabled: false })] })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(db.rows('work_entries')).toHaveLength(0)
    expect(db.rows('work_automation_runs')).toHaveLength(0)
  })
})

describe('runAutomationForUser — zjazdy i wznowienie', () => {
  it('nie dopisuje godzin w okresie pobytu w domu', async () => {
    const db = fake({
      trips: [{ user_id: USER, start_date: '2026-08-20', end_date: '2026-09-02' }],
    })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(datesOf(db.rows('work_entries'))).toEqual(['2026-09-01', '2026-09-02'])
    expect(runFor(db.rows('work_automation_runs'), '2026-09-04')).toMatchObject({
      outcome: 'skipped',
      reason: 'home_stay',
    })
  })

  it('jawne wznowienie otwiera prace bez znanej daty kolejnego zjazdu', async () => {
    const db = fake({
      trips: [{ user_id: USER, start_date: '2026-08-20', end_date: '2026-09-02' }],
      work_automation_resumptions: [{ user_id: USER, resume_date: '2026-09-07' }],
    })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(datesOf(db.rows('work_entries'))).toEqual([
      '2026-09-01', '2026-09-02', '2026-09-07', '2026-09-08',
    ])
  })

  it('blad odczytu wyjazdow wstrzymuje zapis zamiast udawac brak zjazdow', async () => {
    const db = fake({}, { failingTables: ['trips'] })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(db.rows('work_entries')).toHaveLength(0)
    expect(db.rows('work_automation_runs')).toEqual([
      expect.objectContaining({ outcome: 'error', reason: 'trips_unavailable' }),
    ])
  })
})

describe('runAutomationForUser — niepoprawny klient', () => {
  it('usuniety klient daje blad, a nie zapis pod innym klientem', async () => {
    const db = fake({ clients: [] })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(db.rows('work_entries')).toHaveLength(0)
    expect(runFor(db.rows('work_automation_runs'), '2026-09-08')).toMatchObject({
      outcome: 'error',
      reason: 'client_missing',
    })
  })

  it('klient akordowy nie dostaje zgadywanej ilosci', async () => {
    const db = fake({ clients: [client({ work_type: 'piecework' })] })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(db.rows('work_entries')).toHaveLength(0)
    expect(runFor(db.rows('work_automation_runs'), '2026-09-08')).toMatchObject({
      outcome: 'error',
      reason: 'client_not_hourly',
    })
  })

  it('projekt spoza wybranego klienta daje blad', async () => {
    const db = fake({
      work_automation_settings: [settings({ project_id: 'project-x' })],
      work_automation_setting_versions: [version({ project_id: 'project-x' })],
      projects: [{ id: 'project-x', user_id: USER, name: 'Obcy', client_id: 'inny-klient' }],
    })

    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(db.rows('work_entries')).toHaveLength(0)
    expect(runFor(db.rows('work_automation_runs'), '2026-09-08')).toMatchObject({
      outcome: 'error',
      reason: 'project_mismatch',
    })
  })

  it('blad ma byc ponawialny — kolejny przebieg po naprawie tworzy wpis', async () => {
    const db = fake({ clients: [] })
    await runAutomationForUser(asClient(db), USER, { now: NOW })

    db.rows('clients').push(client())
    await runAutomationForUser(asClient(db), USER, { now: NOW })

    expect(datesOf(db.rows('work_entries'))).toContain('2026-09-08')
  })
})

describe('runWorkAutomation — izolacja kont', () => {
  it('kazde konto dostaje wlasne wpisy i wlasny dziennik', async () => {
    const db = fake({
      work_automation_settings: [settings(), settings({}, OTHER_USER)],
      work_automation_setting_versions: [
        version(),
        version({ id: 'v-b', client_id: 'client-b' }, OTHER_USER),
      ],
      clients: [client(), client({ id: 'client-b' }, OTHER_USER)],
    })

    const summary = await runWorkAutomation(asClient(db), NOW)

    expect(summary.processed).toBe(2)
    expect(summary.failed).toBe(0)

    const byUser = (userId: string) =>
      db.rows('work_entries').filter((row) => row.user_id === userId)

    expect(byUser(USER)).toHaveLength(7)
    expect(byUser(OTHER_USER)).toHaveLength(7)
    expect(byUser(USER).every((row) => row.client_id === CLIENT)).toBe(true)
    expect(byUser(OTHER_USER).every((row) => row.client_id === 'client-b')).toBe(true)
  })

  it('wylaczone konto nie trafia do przebiegu', async () => {
    const db = fake({
      work_automation_settings: [settings(), settings({ enabled: false }, OTHER_USER)],
    })

    const summary = await runWorkAutomation(asClient(db), NOW)

    expect(summary.processed).toBe(1)
    expect(db.rows('work_entries').every((row) => row.user_id === USER)).toBe(true)
  })
})
