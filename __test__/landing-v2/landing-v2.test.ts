import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { DEFAULT_WEEK_SCHEDULE } from '@/features/work-automation/domain'

import {
  DEMO_HOME_STAY,
  DEMO_INVOICES,
  DEMO_RATE_EUR,
  DEMO_TRIPS,
  DEMO_WEEK,
  DEMO_WEEK_SCHEDULE,
} from '@/app/(marketing-preview)/landing-v2/_demo/demo-data'
import { buildDemoMonth } from '@/app/(marketing-preview)/landing-v2/_demo/demo-month.server'

/**
 * Landing V2 obiecuje dwie rzeczy, ktorych nie da sie sprawdzic okiem:
 *
 *  1. kalendarz w sekcji automatu pokazuje to, co NAPRAWDE zrobilby automat,
 *  2. na stronie nie ma ani jednej liczby wzietej z sufitu — kwota faktury
 *     wynika z godzin, a godziny z grafiku i wyjazdow.
 *
 * Do tego dochodzi granica: podglad marketingowy nie moze wciagnac autoryzacji
 * ani Supabase, bo ma dzialac bez logowania.
 */

const ROOT = path.resolve(__dirname, '../..')
const LANDING = 'app/(marketing-preview)'

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(path.join(ROOT, dir))) {
    const relative = path.join(dir, entry)
    if (statSync(path.join(ROOT, relative)).isDirectory()) {
      found.push(...sourceFiles(relative))
    } else if (/\.tsx?$/.test(entry)) {
      found.push(relative)
    }
  }
  return found
}

const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')

describe('landing-v2 — miesiac demonstracyjny liczy automat, nie grafik', () => {
  const month = buildDemoMonth()

  it('kopiuje grafik automatu co do godziny', () => {
    // Landing trzyma wlasna kopie (barrel domeny ciagnie zod), wiec kopia musi
    // byc pilnowana — inaczej strona pokazywalaby nieaktualne wartosci domyslne.
    expect(DEMO_WEEK_SCHEDULE).toEqual(DEFAULT_WEEK_SCHEDULE)
  })

  it('nie zapisuje zadnej niedzieli', () => {
    const sundays = month.days.filter((day) => day.weekday === 6)
    expect(sundays).toHaveLength(4)
    expect(sundays.every((day) => day.hours === null)).toBe(true)
  })

  it('trzyma kolejnosc regul automatu: pobyt w domu przed grafikiem', () => {
    // Niedziele 13 i 20 wrzesnia wpadaja w pobyt w domu, wiec automat podaje
    // wlasnie ten powod — reguly maja kolejnosc i landing ja pokazuje.
    const label = (day: number) => month.days[day - 1].skipLabel
    expect(label(6)).toBe('Dzień tygodnia wyłączony w grafiku')
    expect(label(27)).toBe('Dzień tygodnia wyłączony w grafiku')
    expect(label(13)).toBe('Pobyt w domu')
    expect(label(20)).toBe('Pobyt w domu')
  })

  it('nie zapisuje ani jednego dnia pobytu w domu', () => {
    const home = month.days.filter(
      (day) =>
        `2026-09-${String(day.day).padStart(2, '0')}` >= DEMO_HOME_STAY.startDate &&
        `2026-09-${String(day.day).padStart(2, '0')}` <= DEMO_HOME_STAY.endDate,
    )
    expect(home).toHaveLength(8)
    expect(home.every((day) => day.hours === null)).toBe(true)
    expect(home.some((day) => day.skipLabel === 'Pobyt w domu')).toBe(true)
  })

  it('zapisuje dni wyjazdu wedlug grafiku: 10 h w tygodniu, 8 h w sobote', () => {
    const worked = month.days.filter((day) => day.hours !== null)
    expect(worked.every((day) => day.inTrip)).toBe(true)
    expect(worked.every((day) => day.hours === (day.weekday === 5 ? 8 : 10))).toBe(true)
    expect(DEMO_TRIPS).toHaveLength(2)
  })

  it('pelny tydzien wyjazdowy daje dokladnie tyle, ile mowi sekwencja liczb', () => {
    expect(DEMO_WEEK.hours).toBe(DEMO_WEEK.daily.reduce<number>((sum, hours) => sum + hours, 0))
    expect(DEMO_WEEK.hours).toBe(58)
  })

  it('kwota faktury jest iloczynem godzin i stawki, nie liczba z projektu graficznego', () => {
    expect(month.earningsEur).toBe(month.totalHours * DEMO_RATE_EUR)

    const september = DEMO_INVOICES.find((invoice) => invoice.number === 'FV 09/2026')!
    expect(september.hours).toBe(month.totalHours)
    expect(september.amountEur).toBe(month.earningsEur)
  })
})

describe('landing-v2 — podglad stoi obok aplikacji, nie w niej', () => {
  const files = sourceFiles(LANDING)

  it('nie siega po Supabase ani po sesje uzytkownika', () => {
    const offenders = files.filter((file) =>
      /@supabase\/|@\/lib\/supabase|@\/lib\/auth|getServerUser/.test(read(file)),
    )
    expect(offenders, `podglad ma dzialac bez logowania:\n${offenders.join('\n')}`).toEqual([])
  })

  it('z modulow aplikacji bierze wylacznie czysta domene', () => {
    const offenders: string[] = []
    for (const file of files) {
      for (const match of read(file).matchAll(/from '(@\/features\/[^']+)'/g)) {
        if (!match[1].endsWith('/domain')) offenders.push(`${file} → ${match[1]}`)
      }
    }
    expect(offenders, `tylko '@/features/<x>/domain':\n${offenders.join('\n')}`).toEqual([])
  })

  it('nie konkuruje z produkcyjnym landingiem w wyszukiwarce', () => {
    expect(read(`${LANDING}/landing-v2/page.tsx`)).toMatch(/noindex:\s*true/)
    expect(read('app/robots.ts')).toContain("'/landing-v2'")
  })
})
