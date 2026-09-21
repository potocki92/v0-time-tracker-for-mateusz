import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Kazda sekcja panelu miala wlasna implementacje tych samych elementow: trzy
 * akcje glowne o trzech wysokosciach, trzy kafelki KPI, szesc wartosci
 * `tracking` na jednym wzorcu eyebrow, cztery kontenery strony i dwie kopie
 * tej samej palety. Ten plik pilnuje, ze nie wroci zadna z tych szesciu
 * kategorii — inwentarz stanu sprzed ujednolicenia jest w `docs/ui-audit.md`.
 *
 * Asercje chodza po zrodlach, nie po DOM. Wersje przegladarkowa (policzone
 * style, nie klasy) trzyma `e2e/ui-consistency.spec.ts`.
 */
const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.tsx?$/.test(entry)) acc.push(relative(ROOT, full))
  }
  return acc
}

const featureFiles = walk(resolve(ROOT, 'features'))
const sources = new Map(featureFiles.map((f) => [f, read(f)]))

const offenders = (predicate: (source: string) => boolean) =>
  [...sources].filter(([, src]) => predicate(src)).map(([file]) => file)

describe('ui — akcja glowna idzie przez <Button>', () => {
  it('zaden surowy <button> nie maluje sie na akcent', () => {
    // Trzy sekcje mialy trzy rozne przyciski „dodaj": shadcnowy <Button>,
    // recznie sklejony <button> bez wysokosci i <button> z h-8. Akcent nalezy
    // do wariantu `accent`, nie do klasy wklejonej w JSX.
    const found = offenders((src) => /<button[^>]*bg-brand-500/s.test(src))
    expect(
      found,
      `akcje maluja sie recznie zamiast <Button variant="accent">:\n${found.join('\n')}`,
    ).toEqual([])
  })

  it('buttonVariants zna wariant accent', () => {
    expect(
      read('components/ui/button.tsx'),
      'bez wariantu `accent` sekcje wroca do recznego bg-brand-500',
    ).toMatch(/accent:\s*'bg-brand-500 text-brand-foreground hover:bg-brand-400'/)
  })
})

describe('ui — jeden kafelek KPI', () => {
  it('features nie deklaruje wlasnych kafelkow sekcji', () => {
    // `EarningsKpi` w karcie Zarobek zostaje swiadomie — to kafelek
    // ZAGNIEZDZONY w karcie, nie kafelek sekcji. Patrz P2 w docs/ui-audit.md.
    const found = offenders((src) => /function (KpiTile|InvoiceStatCard)\b/.test(src))
    expect(
      found,
      `kafelek KPI ma jedna implementacje — components/common/stat/StatTile.tsx:\n${found.join('\n')}`,
    ).toEqual([])
  })
})

describe('ui — jedna paleta', () => {
  it('features nie trzyma wlasnych slownikow tokenow', () => {
    const found = featureFiles.filter((f) => f.endsWith('.tokens.ts'))
    expect(
      found,
      `paleta panelu mieszka w components/ui/tokens.ts — module-boundaries zabrania importu features -> features, wiec kazda kopia tutaj rozjedzie sie z reszta:\n${found.join('\n')}`,
    ).toEqual([])
  })
})

describe('ui — jeden eyebrow', () => {
  it('features nie ustawia trackingu wartoscia arbitralna', () => {
    const found = offenders((src) => /tracking-\[0\.\d+em\]/.test(src))
    expect(
      found,
      `eyebrow idzie przez <SectionEyebrow> albo token LINEAR.eyebrow (0.18em):\n${found.join('\n')}`,
    ).toEqual([])
  })
})

describe('ui — jeden kontener strony', () => {
  const SECTIONS = /^features\/(clients|projects|invoices|reports|calendar)\//
  const shells = featureFiles.filter(
    (f) => SECTIONS.test(f) && /(Content|Skeleton)\.tsx$/.test(f),
  )

  it('znajduje powloki wszystkich pieciu sekcji', () => {
    // Pulpit celowo poza lista — ma wlasna siatke data-dashboard-grid.
    expect(shells.length, 'zmienil sie uklad plikow sekcji').toBeGreaterThanOrEqual(8)
  })

  for (const shell of shells) {
    it(`${shell} uzywa <PageContainer>`, () => {
      expect(sources.get(shell), `${shell} nie renderuje <PageContainer>`).toContain(
        '<PageContainer',
      )
      expect(
        sources.get(shell),
        `${shell} sklada kontener recznie — szerokosc sekcji znowu rozjedzie sie z sasiadami`,
      ).not.toContain('mx-auto w-full max-w-')
    })
  }
})

describe('ui — kanoniczne powierzchnie kart', () => {
  /**
   * Liczymy wylacznie powierzchnie KART: literal z promieniem `rounded-xl`
   * albo `rounded-2xl`, obramowaniem i tlem ze skali `--surface-*`. Pigulki
   * (`rounded-full`), wiersze list (`rounded-md`/`rounded-lg`) i naglowki
   * arkuszy (`rounded-t-2xl`) sa poza licznikiem — nie sa kartami i nie maja
   * dzielic z nimi promienia. Warianty z prefiksem (`hover:`, `active:`,
   * `data-[…]:`) tez odpadaja: to stany, nie powierzchnia spoczynkowa.
   */
  function cardSurfaces(source: string): string[] {
    const found: string[] = []
    for (const match of source.matchAll(/[`"']([^`"'\n]*)[`"']/g)) {
      const tokens = match[1].split(/\s+/).filter((t) => t && !t.includes(':'))
      const radius = tokens.find((t) => /^rounded-(?:xl|2xl)$/.test(t))
      const background = tokens.find((t) => /^bg-surface-\d$/.test(t))
      const borders = tokens.filter((t) => /^border(?:-.+)?$/.test(t))
      if (radius && background && borders.length) {
        found.push([radius, borders.join(' '), background].join(' | '))
      }
    }
    return found
  }

  it('features uzywa najwyzej trzech zestawow', () => {
    const byVariant = new Map<string, string[]>()
    for (const [file, src] of sources) {
      for (const variant of cardSurfaces(src)) {
        byVariant.set(variant, [...(byVariant.get(variant) ?? []), file])
      }
    }
    const report = [...byVariant]
      .map(([variant, files]) => `${variant}  (${[...new Set(files)].join(', ')})`)
      .join('\n')

    // Trzy: karta, karta zagniezdzona, wariant dashed — wszystkie trzy
    // stoja w SURFACE w components/ui/tokens.ts.
    expect(
      byVariant.size,
      `powierzchnie kart znowu rozjezdzaja sie po sekcjach; uzyj SURFACE.card / SURFACE.cardNested / SURFACE.cardDashed:\n${report}`,
    ).toBeLessThanOrEqual(3)
  })

  it('SURFACE wystawia dokladnie te trzy zestawy', () => {
    const tokens = read('components/ui/tokens.ts')
    for (const name of ['card', 'cardNested', 'cardDashed']) {
      expect(tokens, `brak SURFACE.${name}`).toMatch(new RegExp(`\\b${name}:\\s*'`))
    }
  })
})

describe('ui — karty Pulpitu maja jedna powierzchnie i jeden naglowek', () => {
  /**
   * Pulpit ma wlasna powierzchnie karty (o stopien ciemniejsza niz
   * `SURFACE.card`, ktory obsluguje Projekty, Klientow i Faktury) i wlasne
   * chrome: naglowek z ikona, tytulem i pigulka zakresu jest CZESCIA karty.
   *
   * Przed etapem „mobilny Pulpit" kazda sekcja powtarzala u siebie ten sam
   * literal powierzchni, a tytul wisial nad karta jako osobny blok. Teraz
   * literal stoi raz — w `DASHBOARD_SURFACE` — a chrome w jednym komponencie,
   * wiec kontrakt jest inny: sekcja ma PRZEZ NIEGO isc, a nie odtwarzac go
   * u siebie. Dzieki temu sekcja przeniesiona nad zagiecie dostaje poprawny
   * tytul bez zmiany w jej kodzie.
   */
  const CARD_COMPONENT = 'components/workspace/card/dashboard-section-card.tsx'
  const OLD_SURFACE = 'rounded-lg border border-hairline bg-surface-1'

  const cards = featureFiles.filter(
    (f) =>
      f.startsWith('features/dashboard/components/') &&
      /(Card|EarningsChart|hero-today)\.tsx$/.test(f),
  )

  it('znajduje karty Pulpitu', () => {
    expect(cards.length, 'zmienil sie uklad plikow Pulpitu').toBeGreaterThanOrEqual(9)
  })

  for (const card of cards) {
    it(`${card} idzie przez <DashboardSectionCard>`, () => {
      expect(
        sources.get(card),
        `${card} sklada karte recznie — naglowek oderwie sie od tresci, a powierzchnia rozjedzie z sasiadkami`,
      ).toContain('<DashboardSectionCard')
    })
  }

  it('sekcja Wyjazdow tez idzie przez wspolna karte', () => {
    // `features/trips` stoi na Pulpicie jako sekcja — stad karta mieszka
    // w `components/`, a nie w `features/dashboard`.
    expect(sources.get('features/trips/components/TripCountdownCard.tsx')).toContain(
      '<DashboardSectionCard',
    )
  })

  it('zadna karta sekcji nie powtarza literalu powierzchni Pulpitu', () => {
    // Zakres celowo waski: chodzi o KARTY SEKCJI. Ten sam literal w menu,
    // modalu czy w skeletonie Kalendarza to osobne elementy, nie powierzchnia
    // karty Pulpitu, i nie naleza do tego kontraktu.
    const found = [...cards, 'features/trips/components/TripCountdownCard.tsx'].filter(
      (file) => sources.get(file)?.includes(OLD_SURFACE),
    )
    expect(
      found,
      `powierzchnia karty Pulpitu stoi w DASHBOARD_SURFACE (components/ui/tokens.ts):\n${found.join('\n')}`,
    ).toEqual([])
  })

  it('DASHBOARD_SURFACE wystawia karte i powierzchnie zagniezdzona', () => {
    const tokens = read('components/ui/tokens.ts')
    for (const name of ['card', 'nested']) {
      expect(tokens, `brak DASHBOARD_SURFACE.${name}`).toMatch(
        new RegExp(`DASHBOARD_SURFACE[\\s\\S]*\\b${name}:\\s*'`),
      )
    }
  })

  it('karta rysuje naglowek z tytulu podanego przez zlozenie, nie z propsa sekcji', () => {
    // Gdyby tytul byl propsem karty, kazda sekcja niosla by wlasna kopie
    // nazwy z rejestru — i przeniesienie sekcji nad zagiecie rozjechaloby
    // naglowek z etykieta landmarku.
    const component = read(CARD_COMPONENT)
    expect(component).toContain('aria-label={chrome?.title || undefined}')
    expect(component, 'chrome ma isc przez context, nie przez propsy').toContain(
      'DashboardSectionChromeProvider',
    )
  })

  it('Pulpit nie wraca do shadcnowego <Card>', () => {
    const found = offenders(
      (src) => /from '@\/components\/ui\/card'/.test(src),
    ).filter((f) => f.startsWith('features/dashboard/'))
    expect(
      found,
      `sekcja Pulpitu uzywa <Card> zamiast <DashboardSectionCard>:\n${found.join('\n')}`,
    ).toEqual([])
  })
})

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Kontrakt wspolnej warstwy panelu (`components/workspace/*`).
 *
 * Testujemy ARCHITEKTURE, nie klasy: kto czym wolno sie posluzyc i czy
 * feature nie odbudowuje u siebie czegos, co juz stoi w warstwie wspolnej.
 * Inwentarz stanu sprzed ujednolicenia jest w `docs/ui-audit.md`, opis
 * docelowej warstwy w `docs/workspace-design-system.md`.
 * ─────────────────────────────────────────────────────────────────────────
 */

const SHELL = walk(resolve(ROOT, 'app')).filter((f) => f.includes('(app)'))
const shellSources = new Map(SHELL.map((f) => [f, read(f)]))
/** Panel = sekcje (`features/**`) + powloka zalogowanego obszaru. */
const panelSources = new Map([...sources, ...shellSources])

const panelOffenders = (predicate: (source: string) => boolean) =>
  [...panelSources].filter(([, src]) => predicate(src)).map(([file]) => file)

describe('workspace — jeden system overlayow ekranowych', () => {
  it('panel nie siega po shadcnowy Dialog ani Sheet', () => {
    // Formularz, potwierdzenie, panel szczegolow i arkusz filtrow to ten sam
    // gatunek ekranu. Zanim powstal `WorkspaceOverlay`, kazdy feature wybieral
    // sobie Dialog albo Sheet — stad cztery rozne prezentacje tej samej akcji.
    const found = panelOffenders((src) =>
      /from '@\/components\/ui\/(dialog|sheet)'/.test(src),
    )
    expect(
      found,
      `overlay ekranowy idzie przez <WorkspaceOverlay>:\n${found.join('\n')}`,
    ).toEqual([])
  })

  it('nikt poza warstwa wspolna nie owija Radix Dialoga po swojemu', () => {
    // Wyjatki sa dwa i oba sa prymitywami, nie ekranami: `components/ui/*`
    // (uzywane takze przez strefe publiczna) i sam `WorkspaceOverlay`.
    const found = panelOffenders((src) => /@radix-ui\/react-dialog/.test(src))
    expect(
      found,
      `nowy lokalny system overlay — uzyj <WorkspaceOverlay>:\n${found.join('\n')}`,
    ).toEqual([])
  })

  it('WorkspaceOverlay stoi na jednym prymitywie i jednym drzewie DOM', () => {
    const overlay = read('components/workspace/overlay/workspace-overlay.tsx')
    expect(overlay, 'overlay musi stac na Radix Dialogu').toContain(
      "from '@radix-ui/react-dialog'",
    )
    // Galaz po `useIsMobile()` oznaczalaby remount formularza przy obrocie
    // telefonu i dwa rozne naglowki do utrzymania. Sprawdzamy IMPORT, nie
    // slowo — o samym wyborze mowi komentarz w pliku.
    expect(
      overlay,
      'mobile i desktop rozniA sie CSS-em, nie osobnym drzewem Reacta',
    ).not.toMatch(/from '@\/hooks\/use-mobile'/)
  })

  it('feature nie rozgalezia PREZENTACJI OVERLAYA po breakpoincie w JS', () => {
    // `useIsMobile` samo w sobie jest w porzadku: `ClientsContent` wybiera nim
    // miedzy lista kart a tabela danych, czyli miedzy dwoma roznymi widokami
    // tych samych danych. Zle jest dopiero rozgalezianie TEGO SAMEGO ekranu
    // na „arkusz albo dialog" — a to poznac po overlayu w tym samym pliku.
    const found = panelOffenders(
      (src) => /from '@\/hooks\/use-mobile'/.test(src) && /<WorkspaceOverlay\b/.test(src),
    )
    expect(
      found,
      `wybor „arkusz czy dialog" nalezy do WorkspaceOverlay, nie do feature'a:\n${found.join('\n')}`,
    ).toEqual([])
  })
})

describe('workspace — warstwowanie z jednego miejsca', () => {
  it('features nie wpisuja wlasnych z-indeksow z zakresu overlayow', () => {
    // Zakres >= 40 to warstwa overlayow. Nizsze wartosci (np. `z-[1]` w karcie)
    // buduja lokalny kontekst i nie maja nic wspolnego z kolejnoscia okien.
    const found = offenders((src) =>
      [...src.matchAll(/\bz-\[(\d+)\]/g)].some((m) => Number(m[1]) >= 40),
    )
    expect(
      found,
      `drabinka warstw stoi w LAYER (components/ui/tokens.ts):\n${found.join('\n')}`,
    ).toEqual([])
  })

  it('LAYER opisuje wszystkie trzy pietra', () => {
    const tokens = read('components/ui/tokens.ts')
    for (const name of ['base', 'stacked', 'stackedPopover']) {
      expect(tokens, `brak LAYER.${name}`).toMatch(new RegExp(`\\b${name}:\\s*'z-`))
    }
  })
})

describe('workspace — features nie odbudowuja prymitywow warstwy wspolnej', () => {
  /**
   * Klucz to nazwa deklaracji, wartosc to wspolny odpowiednik. Lista rosnie
   * razem z warstwa wspolna — kazdy wpis to komponent, ktory NAPRAWDE juz
   * istnieje w `components/`, a nie zakaz na wyrost.
   */
  const PROMOTED: Record<string, string> = {
    ReportCard: 'WorkspaceCard',
    StatementCard: 'WorkspaceCard',
    ReportEmptyState: 'WorkspaceEmptyState',
    StatementEmptyState: 'WorkspaceEmptyState',
    SegmentedControl: 'WorkspaceSegmentedControl',
    ReportKpiCard: 'StatTile',
  }

  for (const [local, shared] of Object.entries(PROMOTED)) {
    it(`${local} nie wraca jako komponent feature'a`, () => {
      const found = offenders((src) =>
        new RegExp(`\\bfunction ${local}\\b`).test(src),
      )
      expect(
        found,
        `${local} zyje teraz jako ${shared} w components/ — kopia w features rozjedzie sie z reszta:\n${found.join(
          '\n',
        )}`,
      ).toEqual([])
    })
  }

  it('filtry sekcji ida przez wspolny pasek, nie przez Collapsible', () => {
    // Klienci mieli filtry w `Collapsible`, Raporty w `Sheet` — ten sam gest
    // dawal dwa rozne zachowania.
    const found = offenders(
      (src) =>
        /from '@\/components\/ui\/collapsible'/.test(src) &&
        /activeFilterCount|activeCount|Filtruj|filters\./.test(src),
    )
    expect(
      found,
      `panel filtrow idzie przez <WorkspaceFilters>:\n${found.join('\n')}`,
    ).toEqual([])
  })
})

describe('workspace — jedna skora powierzchni shadcn', () => {
  it('nikt nie przypina wlasnego slownika zmiennych motywu', () => {
    // `DIALOG_DARK_SURFACE` w Fakturach przypinal zahardkodowane hexy razem
    // z zielenia, wiec modal ignorowal wybrany motyw kolorystyczny.
    const found = panelOffenders((src) => /\[--(background|card|popover|primary):/.test(src))
    expect(
      found,
      `powierzchnie panelu przepina klasa .workspace-surface (app/globals.css):\n${found.join('\n')}`,
    ).toEqual([])
  })

  it('.workspace-surface istnieje i nie rusza akcentu motywu', () => {
    const css = read('app/globals.css')
    expect(css, 'brak klasy .workspace-surface').toMatch(/\.workspace-surface\s*\{/)
    const block = css.slice(css.indexOf('.workspace-surface'))
    const body = block.slice(0, block.indexOf('}'))
    for (const themed of ['--primary:', '--ring:', '--brand-h:', '--chart-1:']) {
      expect(
        body,
        `.workspace-surface nadpisuje ${themed} — motyw kolorystyczny uzytkownika przestalby dzialac`,
      ).not.toContain(themed)
    }
  })

  it('powloka i overlay deklaruja skore panelu', () => {
    expect(
      read('app/[locale]/(app)/_layout/AppShell.tsx'),
      'powloka panelu musi nosic .workspace-surface',
    ).toContain('workspace-surface')
    expect(
      read('components/workspace/overlay/workspace-overlay.tsx'),
      'overlay portaluje sie do <body>, wiec nie dziedziczy skory po powloce',
    ).toContain('workspace-surface')
  })
})
