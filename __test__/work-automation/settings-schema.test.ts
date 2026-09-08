import { describe, expect, it } from 'vitest'

import {
  DEFAULT_RUN_TIME,
  DEFAULT_TIME_ZONE,
  DEFAULT_WEEK_SCHEDULE,
  workAutomationSettingsSchema,
  type WorkAutomationSettingsInput,
} from '@/features/work-automation/domain'

const base = {
  enabled: false,
  startDate: '2026-09-01',
  runTime: DEFAULT_RUN_TIME,
  timeZone: DEFAULT_TIME_ZONE,
  weekSchedule: DEFAULT_WEEK_SCHEDULE,
  clientId: '',
  projectId: '',
}

const parse = (overrides: Record<string, unknown> = {}) =>
  workAutomationSettingsSchema.safeParse({ ...base, ...overrides })

const messages = (result: ReturnType<typeof parse>) =>
  result.success ? [] : result.error.issues.map((issue) => issue.message)

describe('workAutomationSettingsSchema — wartosci poczatkowe', () => {
  it('domyslny grafik to pon–pt po 10 h, sobota 8 h, niedziela wylaczona z 8 h', () => {
    expect(DEFAULT_WEEK_SCHEDULE).toEqual({
      mon: { enabled: true, hours: 10 },
      tue: { enabled: true, hours: 10 },
      wed: { enabled: true, hours: 10 },
      thu: { enabled: true, hours: 10 },
      fri: { enabled: true, hours: 10 },
      sat: { enabled: true, hours: 8 },
      sun: { enabled: false, hours: 8 },
    })
    expect(DEFAULT_RUN_TIME).toBe('19:00')
    expect(DEFAULT_TIME_ZONE).toBe('Europe/Warsaw')
  })

  it('wylaczony automat moze byc zapisany bez klienta', () => {
    expect(parse().success).toBe(true)
  })
})

describe('workAutomationSettingsSchema — walidacja grafiku', () => {
  it('wlaczony dzien musi miec dodatnia liczbe godzin', () => {
    const result = parse({
      weekSchedule: { ...DEFAULT_WEEK_SCHEDULE, mon: { enabled: true, hours: 0 } },
    })
    expect(messages(result)).toContain('Włączony dzień musi mieć dodatnią liczbę godzin')
  })

  it('doba jest gorna granica', () => {
    const result = parse({
      weekSchedule: { ...DEFAULT_WEEK_SCHEDULE, mon: { enabled: true, hours: 25 } },
    })
    expect(messages(result)).toContain('Maks. 24 godziny')
  })

  it('godziny z pola tekstowego sa konwertowane na liczbe', () => {
    const result = parse({
      weekSchedule: { ...DEFAULT_WEEK_SCHEDULE, mon: { enabled: true, hours: '7.5' } },
    })
    expect(result.success).toBe(true)
    expect(result.success && result.data.weekSchedule.mon.hours).toBe(7.5)
  })

  it('wylaczony dzien moze miec zero godzin', () => {
    expect(
      parse({ weekSchedule: { ...DEFAULT_WEEK_SCHEDULE, sun: { enabled: false, hours: 0 } } })
        .success,
    ).toBe(true)
  })
})

describe('workAutomationSettingsSchema — wlaczanie automatu', () => {
  const enabled = (overrides: Partial<WorkAutomationSettingsInput> = {}) =>
    parse({ enabled: true, clientId: '00000000-0000-4000-8000-000000000001', ...overrides })

  it('wymaga klienta', () => {
    expect(messages(parse({ enabled: true }))).toContain('Wybierz klienta, do którego trafią wpisy')
  })

  it('wymaga przynajmniej jednego wlaczonego dnia', () => {
    const nothing = Object.fromEntries(
      Object.keys(DEFAULT_WEEK_SCHEDULE).map((key) => [key, { enabled: false, hours: 8 }]),
    )
    expect(messages(enabled({ weekSchedule: nothing as never }))).toContain(
      'Włącz przynajmniej jeden dzień tygodnia',
    )
  })

  it('przechodzi z kompletna konfiguracja', () => {
    expect(enabled().success).toBe(true)
  })
})

describe('workAutomationSettingsSchema — godzina i strefa', () => {
  it('godzina musi byc w formacie HH:mm', () => {
    expect(messages(parse({ runTime: '7:00' }))).toContain('Podaj godzinę w formacie HH:mm')
    expect(messages(parse({ runTime: '24:00' }))).toContain('Podaj godzinę w formacie HH:mm')
    expect(parse({ runTime: '00:00' }).success).toBe(true)
  })

  it('strefa musi byc znana baza IANA', () => {
    expect(messages(parse({ timeZone: 'Europe/Atlantyda' }))).toContain('Nieznana strefa czasowa')
    expect(parse({ timeZone: 'Europe/Berlin' }).success).toBe(true)
  })
})
