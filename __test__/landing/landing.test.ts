import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { DEFAULT_WEEK_SCHEDULE } from '@/features/work-automation/domain'
import { APP_LOCALES } from '@/i18n/config'
import { WORKSPACE_SECTIONS } from '@/lib/workspace/sections'

import marketingDe from '@/messages/de/marketing.json'
import marketingEn from '@/messages/en/marketing.json'
import marketingPl from '@/messages/pl/marketing.json'

import {
  DEMO_CLIENTS,
  DEMO_HOME_STAY,
  DEMO_INVOICES,
  DEMO_PROJECTS,
  DEMO_RATE_EUR,
  DEMO_TRIPS,
  DEMO_WEEK,
  DEMO_WEEK_SCHEDULE,
} from '@/app/[locale]/(marketing)/_landing/demo/demo-data'
import { buildDemoMonth } from '@/app/[locale]/(marketing)/_landing/demo/demo-month.server'
import {
  MARKETING_BOTTOM_SEGMENTS,
  MARKETING_SECTIONS,
} from '@/app/[locale]/(marketing)/_landing/product/nav'

/**
 * Landing obiecuje dwie rzeczy, ktorych nie da sie sprawdzic okiem:
 *
 *  1. kalendarz w sekcji automatu pokazuje to, co NAPRAWDE zrobilby automat,
 *  2. na stronie nie ma ani jednej liczby wzietej z sufitu — kwota faktury
 *     wynika z godzin, a godziny z grafiku i wyjazdow.
 *
 * Do tego dochodza dwie granice: landing nie moze wciagnac autoryzacji ani
 * Supabase (ma dzialac bez logowania), a jego mockup aplikacji nie moze
 * rozjechac sie z narracja scen.
 */

const ROOT = path.resolve(__dirname, '../..')
const LANDING = 'app/[locale]/(marketing)'

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

/** Komentarze zostaja po polsku celowo — audyt dotyczy tekstu dla uzytkownika. */
const stripComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('landing — miesiac demonstracyjny liczy automat, nie grafik', () => {
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
    //
    // Sprawdzamy KLUCZ powodu, nie etykiete: po migracji i18n landing dostaje
    // z serwera `SkipReason`, a zdanie sklada dopiero warstwa tlumaczen.
    const reason = (day: number) => month.days[day - 1].skipReason
    expect(reason(6)).toBe('weekday_off')
    expect(reason(27)).toBe('weekday_off')
    expect(reason(13)).toBe('home_stay')
    expect(reason(20)).toBe('home_stay')
  })

  it('nie zapisuje ani jednego dnia pobytu w domu', () => {
    const home = month.days.filter(
      (day) =>
        `2026-09-${String(day.day).padStart(2, '0')}` >= DEMO_HOME_STAY.startDate &&
        `2026-09-${String(day.day).padStart(2, '0')}` <= DEMO_HOME_STAY.endDate,
    )
    expect(home).toHaveLength(8)
    expect(home.every((day) => day.hours === null)).toBe(true)
    expect(home.some((day) => day.skipReason === 'home_stay')).toBe(true)
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

describe('landing — strona stoi obok aplikacji, nie w niej', () => {
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

  it('jest normalnie indeksowalny pod `/`', () => {
    // Landing jest publiczna wizytowka: canonical na `/`, zero `noindex`
    // i zero sladu po poprzedniej sciezce podgladu w robots.
    const page = read(`${LANDING}/page.tsx`)
    expect(page).toMatch(/path:\s*'\/'/)
    expect(page).not.toMatch(/noindex/)
    expect(read('app/robots.ts')).not.toContain('landing-v2')
  })

  it('zostawia po podgladzie `/landing-v2` wylacznie trwaly redirect na `/`', () => {
    // Druga renderowana kopia strony byla by duplikatem tresci — stary adres
    // ma prowadzic do `/`, a nie do wlasnego route'u.
    expect(files.some((file) => file.includes('landing-v2'))).toBe(false)
    expect(read('next.config.mjs')).toContain(
      "{ source: '/landing-v2', destination: '/', permanent: true }",
    )
  })
})

/**
 * Sidebar mockupu NIE jest kopia 1:1 sidebara panelu i nie moze nia zostac:
 * scena „Projekty" opowiada projekty razem z klientami, wiec osobny wiersz
 * „Klienci" zapalalby pozycje, ktorej zadna scena nie dotyczy. Pelne
 * uzasadnienie stoi w `app/(marketing)/_landing/product/nav.ts`.
 */
describe('landing — nawigacja mockupu laczy klientow ze scena Projekty', () => {
  const segments = MARKETING_SECTIONS.map((section) => section.segment)

  it('pokazuje Projekty i nie pokazuje osobnej pozycji Klienci', () => {
    expect(segments).toContain('projects')
    expect(segments).not.toContain('clients')
  })

  it('nie gubi zadnej innej sekcji panelu', () => {
    // Filtr ma ukrywac dokladnie jedna pozycje — reszta rejestru jedzie
    // dalej z produktu, razem z etykietami, skrotami i badge'ami.
    expect(segments).toEqual(
      WORKSPACE_SECTIONS.filter((section) => section.segment !== 'clients').map(
        (section) => section.segment,
      ),
    )
  })

  it('trzyma dolny pasek mobilny na tej samej liscie co sidebar', () => {
    // Dwie niezalezne listy rozjechalyby sie przy pierwszej zmianie nawigacji.
    expect(MARKETING_BOTTOM_SEGMENTS).toEqual(['dashboard', 'calendar', 'projects', 'invoices'])
    for (const segment of MARKETING_BOTTOM_SEGMENTS) expect(segments).toContain(segment)
  })

  it('podswietla w scenie Projekty wylacznie `projects`', () => {
    const scene = read(`${LANDING}/_landing/sections/ProductJourney.tsx`)
      .split('index:')
      .find((block) => block.startsWith(" '03'"))!
    expect(scene).toContain("highlights: ['projects']")
    expect(scene).not.toContain("'clients'")
  })

  it('nie trzyma copy w komponentach — tylko klucze tlumaczen', () => {
    // Zakaz z zadania: jeden komponent, trzy jezyki. Gdyby ktos wrocil do
    // literalu w JSX, ten test zapali sie zanim tekst trafi na produkcje.
    const offenders: string[] = []
    for (const file of sourceFiles(`${LANDING}/_landing`)) {
      if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(stripComments(read(file)))) offenders.push(file)
    }
    expect(offenders, `copy ma isc z messages/:\n${offenders.join('\n')}`).toEqual([])
  })

  it('nadal pokazuje klientow w tresci sceny Projekty', () => {
    // Klienci znikaja z NAWIGACJI mockupu, nie z opowiesci: KPI i tabela
    // stawek sa dowodem relacji klient → stawka, projekt → budzet.
    //
    // Po migracji i18n copy nie stoi juz w komponencie — sprawdzamy wiec
    // KLUCZ tlumaczenia, ktorego ekran uzywa dwa razy (KPI + naglowek tabeli).
    const screen = read(`${LANDING}/_landing/product/screens/ProjectsScreen.tsx`)
    expect(screen).toContain('DEMO_CLIENTS')
    expect(screen.match(/t\('clients'\)/g) ?? []).toHaveLength(2)
  })

  it('zostawia klientow nietknietych w rejestrze panelu', () => {
    // Ten test jest bezpiecznikiem: naprawa marketingowego sidebara nie moze
    // wyciac sekcji klientow z prawdziwej aplikacji.
    expect(WORKSPACE_SECTIONS.some((section) => section.segment === 'clients')).toBe(true)
  })
})

/**
 * Konto demonstracyjne stoi w dwoch warstwach: `demo-data.ts` trzyma
 * STRUKTURE (id, stawki, relacje, liczby), a `messages/<locale>/marketing.json`
 * OBSADE (nazwy klientow, projektow i wystawcy). Podzial ma sens tylko dopoki
 * obie warstwy sie pokrywaja — dopisany klient bez nazwy pokazalby na
 * landingu surowy klucz `marketing.demo.clients.<id>`.
 */
describe('landing — struktura demo i jego obsada nie moga sie rozjechac', () => {
  const CAST = { pl: marketingPl.demo, de: marketingDe.demo, en: marketingEn.demo }

  it.each(APP_LOCALES)('%s nazywa kazdego klienta i kazdy projekt', (locale) => {
    const demo = CAST[locale]

    expect(Object.keys(demo.clients).sort()).toEqual(DEMO_CLIENTS.map((c) => c.id).sort())
    expect(Object.keys(demo.projects).sort()).toEqual(DEMO_PROJECTS.map((p) => p.id).sort())
  })

  it.each(APP_LOCALES)('%s trzyma inicjaly wystawcy w rozmiarze awatara', (locale) => {
    // Awatar w sidebarze mockupu to kolko 16 px — pelne imie by z niego wyjechalo.
    expect(CAST[locale].seller.initials.length).toBeLessThanOrEqual(2)
    expect(CAST[locale].seller.name.length).toBeGreaterThan(0)
  })
})
