import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DASHBOARD_SECTIONS } from '@/features/dashboard/sections/registry'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const content = read('features/dashboard/components/DashboardContent.tsx')
const sections = read('features/dashboard/components/dashboard-sections.tsx')
/** Zrodlo bez komentarzy — docblock skorupy sam TLUMACZY, czego nie uzywa. */
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const shell = codeOf(read('features/dashboard/components/section-shell.tsx'))

/**
 * Poprzednia wersja tego pliku pilnowala siatki 12-kolumnowej z pasem trzech
 * kart KPI i przyklejona szyna — czyli ukladu, w ktorym pietnascie sekcji
 * o tej samej wadze montowalo sie naraz. Etap „hierarchia Pulpitu" zastapil go
 * ukladem warstwowym, wiec i kontrakt jest inny: nad zagieciem stoi hero
 * i najwyzej trzy karty, reszta jest zwinieta i montowana leniwie.
 */
describe('dashboard — uklad warstwowy', () => {
  it('strona nie wypisuje sekcji recznie — bierze je z rejestru', () => {
    expect(
      content,
      'powrot do listy JSX oznacza, ze rejestr przestal byc zrodlem prawdy',
    ).toContain('<DashboardSections')
    expect(
      sections,
      'sekcje maja isc przez uklad uzytkownika, nie przez staly porzadek',
    ).toContain('useDashboardLayout')
  })

  it('trzyma pas primary w jednym rzedzie od lg', () => {
    expect(sections).toMatch(/data-dashboard-primary/)
    expect(sections).toMatch(/grid-cols-1[^"]*lg:grid-cols-3/)
  })

  it('komorka pasa KPI wymusza min-w-0', () => {
    // Dziecko gridu ma domyslnie min-width: auto — wykres szerszy od kolumny
    // rozpycha uklad zamiast sie skurczyc.
    expect(sections).toMatch(/className="min-w-0"/)
  })

  it('kontener ma max-width', () => {
    expect(
      content,
      'dashboard byl jedyna sekcja bez max-width — linia tekstu rosla do 1400 px',
    ).toMatch(/xl:max-w-\[\d+px\]/)
  })

  it('naglowek z zakladkami zakresu stoi nad sekcjami', () => {
    const beforeSections = content.split('<DashboardSections')[0]
    expect(beforeSections).toContain('<HeaderSection />')
  })

  it('nie renderuje sekcji zwinietej — chowanie CSS-em nie liczy sie jako zwiniecie', () => {
    // Radix odmontowuje `CollapsibleContent`, gdy `open` jest falszywe.
    // `forceMount` albo `hidden` zostawilyby zamontowany komponent, ktory
    // dalej liczy pochodne i rysuje wykres.
    expect(shell).not.toMatch(/forceMount/)
    expect(shell).toMatch(/<CollapsibleContent/)
  })
})

describe('dashboard — budzet nad zagieciem', () => {
  it('nad zagieciem stoi jedno hero i najwyzej trzy karty', () => {
    const above = DASHBOARD_SECTIONS.filter(
      (s) => s.tier === 'hero' || s.tier === 'primary',
    )
    expect(above.filter((s) => s.tier === 'hero')).toHaveLength(1)
    expect(above.length, 'kazda karta ponad cztery to kolejny ekran przewijania')
      .toBeLessThanOrEqual(4)
  })

  it('wszystko spoza pasa nad zagieciem startuje zwiniete', () => {
    const expanded = DASHBOARD_SECTIONS.filter(
      (s) => s.tier !== 'hero' && s.tier !== 'primary' && !s.defaultCollapsed,
    )
    expect(
      expanded.map((s) => s.id),
      'rozwinieta sekcja drugiego planu wraca do osmiu ekranow przewijania',
    ).toEqual([])
  })

  it('nic nie wypadlo z Pulpitu — kazda sekcja jest widoczna albo do wlaczenia', () => {
    const unreachable = DASHBOARD_SECTIONS.filter((s) => !s.defaultVisible)
    expect(
      unreachable.map((s) => s.id),
      'sekcja niewidoczna domyslnie jest osiagalna tylko przez „Dostosuj pulpit" — opisz to w raporcie, jesli tak ma byc',
    ).toEqual([])
  })
})
