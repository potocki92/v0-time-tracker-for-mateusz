# Workspace design system

Język UI **zalogowanego panelu**. Landing, `/auth` i strefa publiczna go nie
dotyczą — one stoją na nietkniętym shadcn.

Wzorcem wizualnym są **Raporty**. Jeżeli nie wiesz, jak coś ma wyglądać,
otwórz `features/reports/**` i zrób tak samo.

---

## 1. Gdzie co mieszka

| co | gdzie |
|---|---|
| overlay, filtry, karta sekcji, pusty stan, segmented control, recipe pól | `components/workspace/**` (barrel: `@/components/workspace`) |
| karta sekcji **Pulpitu** (`DashboardSectionCard`) | `components/workspace/card/dashboard-section-card.tsx` |
| tokeny: `LINEAR`, `SURFACE`, `DASHBOARD_SURFACE`, `LAYER`, `HEATMAP_LEVELS` | `components/ui/tokens.ts` |
| kontener strony, eyebrow, kafelek KPI | `components/common/{section,stat}/**` |
| skala kolorów, `.workspace-surface` | `app/globals.css` |

Wszystko leży w `components/`, bo `__test__/config/module-boundaries.test.ts`
zabrania importów `features/*` → `features/*`. Dwa katalogi zamiast jednego to
koszt historii: `common/{section,stat}` powstały przed warstwą `workspace/`
i przenoszenie ich oznaczałoby ruch w kilkudziesięciu plikach bez zysku
funkcjonalnego. Nowe prymitywy panelu idą do `components/workspace/`.

---

## 2. Powierzchnie

Tło panelu to `--surface-0`. Wyżej idzie drabinka, nie cienie:

```
surface-0   tło strony, overlay backdrop
surface-1   karta pierwszego poziomu w powłoce, korpus overlaya
surface-2   karta sekcji (SURFACE.card), pola formularza
surface-3   wnętrze karty (SURFACE.cardNested), hover
hairline / hairline-strong   kontury
```

Trzy kanoniczne powierzchnie kart (`SURFACE` w `components/ui/tokens.ts`):

| stała | klasy | rola |
|---|---|---|
| `SURFACE.card` | `rounded-2xl border border-hairline-strong bg-surface-2` | karta stojąca na tle sekcji |
| `SURFACE.cardNested` | `rounded-xl border border-hairline-strong bg-surface-3` | panel/wiersz wewnątrz karty |
| `SURFACE.cardDashed` | `rounded-2xl border border-dashed border-hairline bg-surface-2` | pusty stan |

Pulpit ma własną parę powierzchni (`DASHBOARD_SURFACE`), o stopień ciemniejszą:

| stała | klasy | rola |
|---|---|---|
| `DASHBOARD_SURFACE.card` | `rounded-2xl border border-hairline bg-surface-1` | karta sekcji Pulpitu i panel sekcji zwiniętych |
| `DASHBOARD_SURFACE.nested` | `rounded-xl border border-hairline bg-surface-2` | panel/wiersz wewnątrz karty Pulpitu |

Głębię dokładają dwie klasy prezentacyjne z `app/globals.css`, nie cień:
`.dashboard-canvas` (bardzo delikatny chłodny tint tła strony) i
`.dashboard-card` (włos wewnętrznego światła przy górnej krawędzi karty).

Zasady:

- **Głębia z powierzchni i konturu, nie z cienia.** `shadow-lg` w panelu to błąd.
- `rounded-2xl` = karta pierwszego poziomu, `rounded-xl` = element zagnieżdżony
  i pole formularza, `rounded-full` = pigułka. Nic innego.
- **Nie wpisuj `bg-card` / `bg-background` ręcznie.** Dzięki
  `.workspace-surface` (§7) rozwiążą się poprawnie, ale nazwa kłamie o tym,
  co robisz.
- Kolory semantyczne (`destructive`, `warning`, `positive`) zostają kolorami.
  Wyszarzenie ich kasuje jedyny sygnał, że akcja jest nieodwracalna.
- Akcent motywu (`brand-*`) **bardzo oszczędnie**: akcja główna sekcji,
  pasek postępu, aktywny element nawigacji. Stan aktywny w kontrolkach
  wyraża się bielą na czarnym tekście, nie akcentem.

## 3. Typografia

| rola | klasy |
|---|---|
| eyebrow / etykieta pola | `<SectionEyebrow>` albo `LINEAR.eyebrow` (`text-2xs`, `uppercase`, `tracking-[0.18em]`, `text-zinc-400`) |
| dane pierwszoplanowe | `text-white`, przy liczbach `tabular-nums` |
| treść drugorzędna | `text-zinc-300` |
| metadane, podpisy | `text-zinc-400` |
| tytuł overlaya | `text-base font-semibold text-white` |

Każda liczba, którą użytkownik porównuje w pionie (kwoty, godziny, liczniki),
dostaje `tabular-nums`. Bez tego kolumna „skacze" przy zmianie cyfry.

Nie ustawiaj `tracking-[0.xxem]` z palca — pilnuje tego
`__test__/config/ui-consistency.test.ts`.

## 4. Odstępy i geometria

```
karta sekcji       p-4 sm:p-5
kafelek KPI        p-4 sm:p-5     (ten sam rytm co karta)
pasek filtrów      p-3 sm:p-4
overlay: header    px-4 py-3 sm:px-5
overlay: body      px-4 py-4 sm:px-5
overlay: footer    px-4 py-3 sm:px-5
odstęp sekcji      space-y-5      (PageContainer)
pole formularza    h-11, rounded-xl
przycisk w stopce  h-11 na telefonie, sm:h-9 na desktopie
```

`h-11` (44 px) to minimalny cel dotykowy. Na desktopie kontrolki schodzą
do `h-9`, bo celem jest kursor.

---

## 5. `WorkspaceOverlay` — jedyny overlay ekranowy

```tsx
<WorkspaceOverlay
  open={open}
  onOpenChange={setOpen}
  title="Nowy projekt"
  description="Uzupełnij podstawowe dane i terminy."
  size="lg"
>
  <WorkspaceOverlayForm onSubmit={handleSubmit}>
    <WorkspaceOverlayBody className="grid gap-4">{/* pola */}</WorkspaceOverlayBody>
    <WorkspaceOverlayFooter>
      <Button variant="outline" onClick={() => setOpen(false)} className="h-11 sm:h-9">Anuluj</Button>
      <Button type="submit" variant="accent" className="h-11 sm:h-9">Zapisz</Button>
    </WorkspaceOverlayFooter>
  </WorkspaceOverlayForm>
</WorkspaceOverlay>
```

**Zachowanie.** Jeden Radix Dialog, jedno drzewo DOM. Poniżej `sm` (640 px)
arkusz od dołu: `rounded-t-2xl`, `max-h-90dvh`, safe-area na dole. Od `sm`
w górę wyśrodkowany panel: `rounded-2xl`, `max-h-85dvh`. Przewija się
**wyłącznie** `WorkspaceOverlayBody` — nagłówek i stopka zostają widoczne.

**Rozmiary.** `sm` potwierdzenia · `md` krótkie formularze · `lg` pełne
formularze i panele szczegółów · `xl` builder faktury. Nie dokładaj piątego
bez ekranu, który go potrzebuje.

**Kiedy używać.** Formularz, potwierdzenie, panel szczegółów, arkusz filtrów,
lista akcji wiersza, ustawienia — wszystko, co przykrywa ekran i ma własny
nagłówek.

**Kiedy NIE używać.**

- `DropdownMenu`, `Popover`, `SelectContent`, `Tooltip` — to menu kontekstowe
  przypięte do elementu, nie ekrany. Zostają jak są.
- Sidebar nawigacyjny (`components/ui/sidebar.tsx`) — to nawigacja powłoki.
- Treść, która może stać inline. Overlay kosztuje krok, blokuje kontekst
  i zabiera scroll; jeżeli sekcja ma miejsce, pokaż rzecz na miejscu.
- `Collapsible` do rozwijania sekcji na stronie (Pulpit) — to nie overlay.

**Potwierdzenia** idą przez `WorkspaceConfirmOverlay` — ten sam system
w kompaktowym wariancie:

```tsx
<WorkspaceConfirmOverlay
  open={Boolean(client)} onOpenChange={(o) => !o && onClose()}
  title="Usunąć klienta?" confirmLabel="Usuń" pendingLabel="Usuwanie..."
  isPending={isPending} onConfirm={onConfirm}
>
  <span className="font-medium text-white">{client?.name}</span> zostanie trwale usunięty.
</WorkspaceConfirmOverlay>
```

**Warstwy.** `LAYER` w `components/ui/tokens.ts` — jedno miejsce na całą
drabinkę:

| piętro | z-index | kiedy |
|---|---|---|
| `LAYER.base` | 50 | overlay otwarty ze strony |
| `LAYER.stacked` | 60 | overlay otwarty **z wnętrza** innego overlaya (`layer="stacked"`) |
| `LAYER.stackedPopover` | 70 | `SelectContent`/`PopoverContent` renderowany w overlayu `stacked` |

Nie wpisuj `z-[…]` z zakresu ≥ 40 w kodzie feature'a. Jeżeli potrzebujesz
nowego piętra, dopisz je do `LAYER`.

**Dostępność.** Focus trap, Escape, scroll lock i `aria-modal` daje Radix.
Tytuł jest zawsze `DialogTitle`. `description` renderuje `DialogDescription`
i wpina je w `aria-describedby`; gdy zdanie w UI byłoby szumem, użyj
`srDescription`. Przy `<form>` sięgnij po `WorkspaceOverlayForm` — przycisk
`submit` w stopce musi mieć formularz nad sobą.

## 6. `WorkspaceFilters` — jeden pasek filtrów

```tsx
<WorkspaceFilters
  sectionLabel={t('filters.sectionLabel')}
  title={t('filters.title')}
  description={t('filters.description')}
  activeCount={activeCount}
  onReset={reset}
  trailing={sortSelect}          // obok triggera na telefonie
  desktopTrailing={compareButton} // w stopce wersji inline
>
  {/* POLA — te same na telefonie i na desktopie */}
</WorkspaceFilters>
```

Feature dostarcza **wyłącznie pola i licznik**. Trigger, badge aktywnych
filtrów, arkusz, scroll, „resetuj"/„zastosuj" i wersja inline należą do paska.

- **Mobile (< md):** trigger + slot pomocniczy + skrót „wyczyść". Pola
  otwierają się w `WorkspaceOverlay`.
- **Desktop (≥ md):** te same pola inline, stopka z resetem.
  `inlineOnDesktop={false}`, gdy sekcja ma na desktopie własny toolbar
  (tabela danych w Klientach).

Pola renderują się raz: wersja inline znika, kiedy arkusz jest otwarty —
inaczej `id` pól dublowałyby się i `<label htmlFor>` trafiałby w niewidoczną
kopię. Z tego samego powodu **nie** przekazuj tej samej kontrolki i w
`children`, i w `desktopTrailing`.

Sortowanie zostaje osobną kontrolką obok triggera (`trailing`) — to nie filtr,
tylko porządek.

## 7. Pola formularza

Recipe, nie komponent-wrapper: pola panelu to w większości natywne `<select>`
i `<input type="date">` (systemowy kalendarz i lista są na telefonie lepsze
niż cokolwiek własnego), a wrapper wokół natywnego elementu to kolejna warstwa
propsów bez zysku.

```tsx
import { WORKSPACE_FIELD, WORKSPACE_FIELD_LABEL, WORKSPACE_FIELD_MULTILINE } from '@/components/workspace'

<Label htmlFor="x" className={WORKSPACE_FIELD_LABEL}>Nazwa</Label>
<Input id="x" className={WORKSPACE_FIELD} />
<SelectTrigger className={WORKSPACE_FIELD}>…</SelectTrigger>
<Textarea className={WORKSPACE_FIELD_MULTILINE} />
```

`h-11`, `rounded-xl`, `bg-surface-2`, kontur hairline, `text-zinc-200`,
wyciszony placeholder, **jeden** pierścień focusu (`ring-zinc-500/60`),
spójny stan `disabled`. Shadcnowe `Input`/`Select`/`Textarea` zostają
nietknięte — używa ich też strefa publiczna z jasnym motywem.

### `.workspace-surface`

Panel jest ciemny niezależnie od wybranego schematu, ale shadcnowe prymitywy
czytają `--background`, `--card`, `--popover`, `--border`. Klasa
`.workspace-surface` (w `app/globals.css`) przepina **wyłącznie powierzchnie
i kontury** na skalę panelu. `--primary`, `--ring`, `--brand-*` i `--chart-*`
dziedziczą się z `<html>`, więc motyw kolorystyczny użytkownika dalej działa.

Klasę noszą dwa miejsca: powłoka panelu (`AppShell`) i `WorkspaceOverlay`.
Overlay potrzebuje jej osobno, bo portaluje się do `<body>`, poza drzewo
powłoki. **Ten sam powód dotyczy portalowanych menu:** `SelectContent`
i `PopoverContent` otwierane w panelu też renderują się poza powłoką —
jeżeli takie menu ma nosić skórę panelu, dopisz mu `className="workspace-surface"`.

## 8. Karty, KPI i kontrolki

```tsx
<WorkspaceCard title={t('trend.title')} ariaLabel={t('trend.sectionLabel')} action={<segmented/>}>
  …
</WorkspaceCard>

<WorkspaceEmptyState icon={SearchX} title="Brak wyników" description="…" action={<Button/>} />

<WorkspaceSegmentedControl
  ariaLabel="Metryka" value={metric} options={[…]} onChange={setMetric}
/>

<StatTile label="Suma godzin" value="128 h" icon={Sigma} meta="w tym okresie" trend={<TrendBadge/>} />
```

- `WorkspaceCard` — karta sekcji z eyebrow i slotem na akcję. Powtarzalność
  jest tu strukturalna (ten sam padding, ten sam odstęp pod nagłówkiem),
  dlatego komponent, a nie skopiowany `className`.
- `WorkspaceSegmentedControl` — przełącznik przekroju. Pigułki celowo nie są
  `role="tab"`: nie przełączają paneli, tylko zawartość tej samej sekcji.
  Stan aktywny to białe tło i czarny tekst.
- `StatTile` — **jedyny** kafelek KPI sekcji. `trend` to slot na znacznik
  zmiany (Raporty), `progress` rysuje pasek, `compact` obniża stopień, gdy
  wartością jest tekst, a nie liczba.

### `DashboardSectionCard` — karta sekcji Pulpitu

```tsx
<DashboardSectionCard padded={false} meta={<CountPill/>} actions={<Link/>}>
  …
</DashboardSectionCard>
```

Nagłówek (ikona, tytuł, pigułka zakresu) jest **częścią karty**, a nie blokiem
nad nią. Karta nie przyjmuje tytułu propsem: bierze go z contextu, który
ustawia złożenie Pulpitu (`features/dashboard/components/dashboard-sections.tsx`)
wprost z rejestru sekcji. Dzięki temu dowolna sekcja przeniesiona w „Dostosuj
pulpit" nad zagięcie dostaje poprawny nagłówek i poprawną etykietę landmarku
bez zmiany w swoim kodzie.

Dwa warianty chrome:

| wariant | kiedy | co rysuje karta |
|---|---|---|
| `card` | sekcja nad zagięciem | powierzchnia + nagłówek + landmark `<section aria-label>` |
| `inline` | sekcja rozwinięta w panelu zwiniętych | sam landmark i treść — tytuł niesie wiersz-przełącznik `<SectionShell>` |

Ikony nagłówków stoją w `features/dashboard/sections/presentation.ts`
(mapa po `id` sekcji) — nie w rejestrze i **nigdy** w zapisanym układzie
Zustanda: komponent Lucide nie jest wartością serializowalną.

## 9. Mobile vs desktop

Regułą jest **CSS, nie JS**. Ten sam DOM zmienia pozycję i geometrię przez
breakpointy. `useIsMobile()` jest dopuszczalne tylko wtedy, gdy telefon
i desktop pokazują **inną treść** (lista kart vs tabela danych w Klientach) —
nigdy po to, żeby wybrać między arkuszem a dialogiem. Gałąź po JS remountuje
formularz przy obrocie telefonu (traci wpisane dane) i podwaja liczbę
nagłówków do utrzymania.

Nie dokładaj biblioteki animacji. `tw-animate-css` + prymitywy Radiksa
wystarczają na wszystko, co panel robi.

## 10. i18n

Obowiązuje `CLAUDE.md` §5 i `docs/i18n.md`. Prymitywy warstwy wspólnej biorą
swoje własne teksty z `common.*` (`common.actions.close`, `common.filters.*`);
feature dostarcza tylko to, co jest jego — tytuł, opis, etykiety pól.

## 11. Świadome wyjątki

| co | dlaczego zostaje |
|---|---|
| `LinearCard` (Projekty) | inna anatomia: nagłówek i stopka oddzielone konturem, korpus bez paddingu. Stoi na `SURFACE.card` i `LINEAR.*`, więc mówi tym samym językiem; wciśnięcie go w `WorkspaceCard` wymagałoby pięciu propsów „na wszelki wypadek". |
| Układ Pulpitu (`data-dashboard-primary` / `data-dashboard-rest`) i jego powierzchnie `DASHBOARD_SURFACE` | Pulpit ma gęstsze karty, własną hierarchię (karta wiodąca + pas trzech + panel zwiniętych) i nagłówek wewnątrz karty. Wewnątrz siebie jest spójny, bo wszystkie sekcje idą przez `DashboardSectionCard` — pilnuje tego osobny blok w `ui-consistency.test.ts`. |
| `EarningsKpi` w karcie Zarobki | mikro-statystyka **wewnątrz** karty, nie kafelek sekcji: ikona po lewej, wartość `text-sm`. |
| `KPICard` (Kalendarz) | kontener na dowolne dzieci, nie kafelek „etykieta + wartość". |
| Pigułki statusów w Fakturach | pasek zakładek z licznikami (`role="tab"`), nie panel filtrów — nie ma czego wkładać do arkusza. |
| `components/ui/*` | używane także przez landing i `/auth`. Nigdy nie przemalowuj ich globalnie pod panel. |

## 12. Czego pilnują testy

`__test__/config/ui-consistency.test.ts`:

- panel nie importuje `components/ui/{dialog,sheet}`,
- nikt poza warstwą wspólną nie owija Radix Dialoga,
- `WorkspaceOverlay` nie rozgałęzia się po `useIsMobile`,
- feature nie rozgałęzia prezentacji overlaya po breakpoincie w JS,
- brak z-indeksów ≥ 40 w `features/**`,
- feature nie odtwarza promowanych prymitywów (`ReportCard`, `StatementCard`,
  `SegmentedControl`, `ReportKpiCard`, …),
- filtry nie wracają do `Collapsible`,
- nikt nie przypina własnego słownika zmiennych motywu,
- `.workspace-surface` nie nadpisuje akcentu motywu.

Testujemy kontrakt architektury, nie przypadkowe stringi klas. Dodając nowy
prymityw do warstwy wspólnej, dopisz go do mapy `PROMOTED` w tym pliku.
