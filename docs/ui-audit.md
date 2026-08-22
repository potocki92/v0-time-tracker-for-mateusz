# Audyt spojnosci UI panelu

Stan na commit bazowy gałęzi `claude/ui-panel-consistency-wx63y9`.
Liczniki policzone rekurencyjnie po `features/**` (`.ts` + `.tsx`), o ile w tabeli
nie zapisano inaczej. Kolumna „docelowy prymityw” opisuje warstwę wspólną
z Fazy 2 — wszystko ląduje w `components/`, bo
`__test__/config/module-boundaries.test.ts` zabrania importów `features/*` → `features/*`.

## Faza 0 — baseline: czego NIE udało się zebrać

`npm run build` przechodzi (22 trasy, bez ostrzeżeń).

`npx playwright test e2e/screenshots.spec.ts` **nie da się uruchomić w tym środowisku**:
`e2e/auth.setup.ts` loguje się do lokalnego Supabase, a kontener nie ma demona Dockera
(`docker ps` → `dial unix /var/run/docker.sock: no such file or directory`), więc
`npx supabase start` nie wstanie. Brak też zmiennych `TEST_USER_A_*`.
`docs/screenshots/` zawiera dziś wyłącznie `README.md` — w repo nigdy nie było plików PNG,
więc nie ma także materiału „przed” do porównania z historii.

Konsekwencja: katalog `docs/screenshots/_before/` nie powstał, a sekcja „Po migracji”
(Faza 5) nie może opierać się na parach zrzutów. Różnice wizualne opisane są
z lektury klas i zaznaczone jako **nieverified wizualnie**.

## 1. Akcja główna sekcji

Regexp kontrolny (ten sam, którego używa `__test__/config/ui-consistency.test.ts`):
`/<button[^>]*bg-emerald-500/s` — trafia dziś w 5 plików `features/**`.

| wariant | wystąpienia | pliki | docelowy prymityw |
|---|---|---|---|
| `<Button size="sm">` (shadcn, `variant=default` → `bg-primary`, `h-8`, `rounded-md`, `text-sm`) | 1 | `features/clients/components/ClientsContent.tsx` („Dodaj klienta”) | `<Button variant="accent" size="sm">` |
| surowy `<button>`: `rounded-lg px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-black` (bez stałej wysokości → ~28 px) | 1 | `features/projects/components/sections/HeaderSection.tsx` („Nowy projekt”) | `<Button variant="accent" size="sm">` |
| surowy `<button>`: `h-8 rounded-lg px-3 text-xs font-semibold bg-emerald-500 text-black` | 1 | `features/invoices/components/analytics/InvoiceFilterToolbar.tsx` („Nowa faktura”) | `<Button variant="accent" size="sm">` |
| surowy `<button>` akcji drugorzędnej: `rounded-lg border px-3 py-1.5 text-xs` + `LINEAR.surfaceElevated` | 1 | `features/projects/components/sections/HeaderSection.tsx` („Export”) | `<Button variant="outline" size="sm">` |
| surowy `<button>` akcji drugorzędnej: `h-10 rounded-xl border border-hairline bg-surface-2 px-3 text-sm` | 1 | `features/reports/components/ReportsExportMenu.tsx` („Eksport”, trigger dropdownu) | `<Button variant="outline" size="sm">` |

Trzy akcje główne mają dziś **trzy różne wysokości** (32 px / ~28 px / 32 px), dwa różne
promienie (`rounded-md` vs `rounded-lg`), dwa stopnie pisma (`text-sm` vs `text-xs`)
i dwa tła (`bg-primary` vs `bg-emerald-500`). To jest regresja, którą pilnuje
`e2e/ui-consistency.spec.ts`.

### 1a. Trafienia regexpu, które NIE są akcją główną

| plik | co to jest | uwaga |
|---|---|---|
| `features/invoices/components/analytics/InvoiceDetailsPanel.tsx:227` | „Oznacz jako opłaconą” — `h-12 w-full`, solid emerald tylko gdy `!isPaid` | akcja główna panelu, ale pełnej szerokości; `variant="accent"` + `className` na wysokość/szerokość |
| `features/projects/components/linear/ProjectDetailsPanel.tsx:146` | „Edytuj projekt” — `h-12 w-full`, emerald wyłącznie w `hover:` | akcja drugorzędna; `variant="outline"` |
| `features/calendar/components/insights/RecentEntries.tsx:29` | „Zobacz wszystkie” — link-akcja, emerald wyłącznie w `hover:`/`focus-visible:` | akcja tekstowa; `variant="ghost"` |

Te trzy nie są „akcją główną sekcji”, ale wpadają w regexp z Fazy 4a, bo są surowymi
`<button>`ami niosącymi klasę `bg-emerald-500*`. Żeby test 4a miał sens (a nie był
obchodzony wyjątkami), idą przez `<Button>` z odpowiednim wariantem — **bez** zmiany
geometrii (`className` dopina `h-12 w-full` itd.).

## 2. Kafelek KPI

| wariant | wystąpienia (użyć) | pliki | docelowy prymityw |
|---|---|---|---|
| `KpiTile` — `rounded-xl border p-3.5 sm:p-4`, wartość `text-3xl sm:text-4xl`, opcjonalny pasek `progress` + `accent`, ikona w ramce | 4 | deklaracja: `features/projects/components/linear/KpiTile.tsx`; użycia: `features/projects/components/sections/KpiSection.tsx` | `StatTile` |
| lokalny `KpiTile` — jak wyżej, ale wartość `text-2xl sm:text-3xl`, etykieta z `min-h-[2.4em]`, prop `compact` (nazwa klienta zamiast liczby), bez `progress`/`accent` | 4 | deklaracja i użycia: `features/clients/components/ClientsStats.tsx` | `StatTile` |
| `InvoiceStatCard` — `rounded-2xl border border-hairline bg-surface-1 p-4 sm:p-5`, badge z `tone`, `secondaryAmount`, `description` | 4 | deklaracja: `features/invoices/components/analytics/InvoiceStatCard.tsx`; użycia: `features/invoices/components/analytics/InvoiceStatsGrid.tsx` | `StatTile` |
| `KpiCard` (raporty) — `rounded-2xl border border-hairline bg-surface-1 p-4 sm:p-5`, `hint` + `TrendBadge` | 3 | deklaracja i użycia: `features/reports/components/ReportsKpis.tsx` | **poza ujednoliceniem** (patrz niżej) |
| lokalny `KpiTile` (Pulpit, pasek w karcie Zarobki) — `rounded-lg border p-2.5`, wartość `text-sm`, ikona po lewej, `hint` po prawej | 3 | deklaracja i użycia: `features/dashboard/components/sections/earnings/EarningsCard.tsx` | **poza ujednoliceniem** — zmiana nazwy na `EarningsKpi` (P2) |
| `KPICard` (Kalendarz) — `Card` + `CardContent`, ikona w kółku `bg-emerald-500/10`, `Progress` | 4 | `features/calendar/components/stats/KPICard.tsx` + 4 karty w `features/calendar/components/stats/` | **poza ujednoliceniem** (patrz niżej) |

**Poza ujednoliceniem świadomie:**
- `ReportsKpis.KpiCard` nosi `TrendBadge` z ikoną kierunku — API `StatTile` musiałoby przyjąć
  węzeł Reacta w `badge`, co jest propem „na zapas” dla trzech migrowanych komponentów
  (CLAUDE.md §2). Zadanie wymienia trzy implementacje do migracji i ta nie jest jedną z nich.
- `calendar/stats/KPICard` stoi na shadcnowym `Card` i ma inną anatomię (ikona w kółku,
  `Progress` z shadcn). Zadanie nie wymienia go, a test 4a go nie obejmuje
  (blokuje `function KpiTile` i `function InvoiceStatCard`, nie `KPICard`).

## 3. Powierzchnie kart

Pełna lista kombinacji `rounded-* + border-* + bg-surface-*` znalezionych w jednym literale
klas w `features/**`. Warianty z dwoma tokenami obramowania to gałęzie warunkowe
w jednym `cn()` (np. `active ? 'border-emerald-500/40' : 'border-hairline'`).

| `rounded` | `border` | `bg` | wystąpienia | rola |
|---|---|---|---|---|
| `rounded-lg` | `border border-hairline` | `bg-surface-1` | 20 | karta 1. poziomu (Pulpit, Kalendarz) |
| `rounded-md` | `border border-hairline` | `bg-surface-2` | 10 | wiersz / kafelek zagnieżdżony |
| `rounded-2xl` | `border border-hairline` | `bg-surface-1` | 10 | karta 1. poziomu (Faktury, Raporty, Wyjazdy) |
| `rounded-lg` | `border-hairline` | `bg-surface-1` | 9 | karta 1. poziomu przez `<Card className>` (Kalendarz) |
| `rounded-xl` | `border border-hairline` | `bg-surface-2` | 9 | karta zagnieżdżona / panel |
| `rounded-lg` | `border border-hairline` | `bg-surface-2` | 5 | wiersz zagnieżdżony |
| `rounded-md` | `border-hairline` / `border-hairline-strong` | `bg-surface-2` | 4 | wiersz zagnieżdżony (warunkowy) |
| `rounded-md` | `border-hairline` / `border-emerald-500/40` | `bg-surface-2` | 4 | wiersz zaznaczony (warunkowy) |
| `rounded-xl` | `border-hairline-strong` | `bg-surface-2` | 4 | karta listy mobilnej (Klienci) |
| `rounded-2xl` | `border border-dashed border-hairline` | `bg-surface-1` | 3 | pusty stan (Faktury) |
| `rounded-full` | `border border-hairline` | `bg-surface-2` | 2 | pigułka / segmented control |
| `rounded-xl` | `border-hairline` / `border-hairline-strong` | `bg-surface-2` | 2 | panel zaznaczony (warunkowy) |
| `rounded-xl` | `border border-hairline` | `bg-surface-1` | 2 | karta 1. poziomu |
| `rounded-t-2xl` | `border border-hairline` / `border-hairline` | `bg-surface-1` | 2 | nagłówek tabeli / sheet |
| pozostałe 14 kombinacji po 1 | — | — | 14 | pojedyncze wyjątki |

Razem **28 różnych kombinacji, 100 wystąpień** w `features/**`.

Do tego dochodzą powierzchnie wyrażone tokenami, nie literałem:
`LINEAR.surface` (`bg-surface-2`) + `LINEAR.border` (`border-hairline-strong`) — 74 użycia
`LINEAR.*` w 14 plikach Projektów i Klientów.

### Wybór kanoniczny

Najczęstszy literał to `rounded-lg border border-hairline bg-surface-1` (20). **Nie wybieram go.**
Uzasadnienie: te 20 wystąpień to prawie w całości Pulpit (17 z 20 plików), którego siatka
`data-dashboard-grid` jest z zadania wyłączona z ujednolicania kontenera, a jego karty są
gęstsze niż karty sekcji listowych. Karta 1. poziomu w sekcjach, które realnie migruję
(Klienci, Projekty, Faktury, Raporty), to dziś `rounded-xl`/`rounded-2xl` na `bg-surface-2`
z `border-hairline-strong` (`LINEAR.surface` + `LINEAR.border`) — i to ten zestaw jest już
źródłem prawdy w `linear.tokens.ts`, czyli w pliku, który zadanie każe przenieść 1:1 do
`components/ui/tokens.ts` „bez wymyślania nowych wartości”.

Kanoniczny zestaw (stałe w `components/ui/tokens.ts`, nie osobny komponent — audyt nie
wykazał potrzeby slotów):

| stała | klasy | rola |
|---|---|---|
| `SURFACE.card` | `rounded-xl border border-hairline-strong bg-surface-2` | karta 1. poziomu |
| `SURFACE.cardNested` | `rounded-lg border border-hairline-strong bg-surface-3` | karta / wiersz zagnieżdżony |
| `SURFACE.cardDashed` | `rounded-xl border border-dashed border-hairline bg-surface-2` | pusty stan |

Drabinka kontrastu `surface-2 → surface-3` jest ta sama, którą opisuje komentarz
w `linear.tokens.ts` i której pilnuje `__test__/config/design-tokens.test.ts`
(monotoniczność skali + kontrast konturu do powierzchni).

## 4. Eyebrow

Wzorzec `text-2xs font-semibold uppercase tracking-[…]`. W `features/**`: **54 wystąpienia
w 40 plikach**, sześć różnych wartości `tracking`.

| wariant | wystąpienia | pliki (skrót) | docelowy prymityw |
|---|---|---|---|
| `tracking-[0.18em]` | 36 | Pulpit (11), Faktury (8), Projekty (6), Raporty (4), Klienci (2), Kalendarz (1), Wyjazdy (2), oba `*.tokens.ts` (2) | `<SectionEyebrow>` |
| `tracking-[0.14em]` | 8 | `calendar/insights/*` (4), `calendar/stats/KPICard` (1), `dashboard/…/QuarterlySummaryCard` (3) | `<SectionEyebrow>` |
| `tracking-[0.16em]` | 6 | `clients/ClientCard`, `clients/CurrentClientCard`, `invoices/…/InvoiceARAgingCard`, `projects/linear/FeaturedProjectCard`, `projects/linear/ProjectListRow`, `trips/TripCountdownCard` | `<SectionEyebrow>` |
| `tracking-[0.22em]` | 2 | `dashboard/…/shared/SectionHeader`, `reports/ReportsHeader` | `<SectionEyebrow>` |
| `tracking-[0.2em]` | 1 | `invoices/…/InvoicesPageHeader` | `<SectionEyebrow>` |
| `tracking-[0.1em]` | 1 | `invoices/…/InvoicesPageHeader` (pigułka waluty) | `<SectionEyebrow>` |

Poza `features/**` zostają `app/(app)/_layout/components/sidebar/SidebarNav.tsx`
(`tracking-[0.08em]`, 2×) i `app/auth/_components/AuthShowcase.tsx` (`tracking-[0.18em]`, 1×) —
layout i landing, obie strefy zadanie wyłącza.

## 5. Kontener strony

| wariant | wystąpienia | pliki | docelowy prymityw |
|---|---|---|---|
| `mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4 md:max-w-5xl md:px-6 md:pb-10 md:pt-3 lg:px-8` | 6 | `clients/ClientsContent`, `projects/ProjectsContent`, `projects/ProjectsSkeleton`, `reports/ReportsContent`, `reports/ReportsSkeleton`, `calendar/CalendarContent` | `<PageContainer>` |
| `mx-auto w-full max-w-3xl space-y-5 px-4 py-6 pb-28 lg:max-w-6xl lg:pb-10` | 1 | `invoices/…/InvoicesContent` | `<PageContainer>` (**zwężenie**) |
| `container space-y-6 px-4 py-6` | 1 | `clients/ClientsSkeleton` | `<PageContainer>` |
| `container space-y-4 px-4 py-4 sm:space-y-5 sm:py-6` | 1 | `calendar/CalendarSkeleton` | `<PageContainer>` |

Pulpit (`DashboardContent` / `DashboardSkeleton`) nie ma kontenera tego typu — ma własną
siatkę `data-dashboard-grid` / `data-dashboard-rail`, której zadanie zabrania ruszać.
Sekcja Faktury nie ma pliku `*Skeleton.tsx`.

Zwężenie Faktur (`max-w-3xl`/`lg:max-w-6xl` → `max-w-2xl`/`md:max-w-5xl`) to jedyna zmiana
z tej kategorii, która realnie zmienia szerokość treści: układ dwukolumnowy
`lg:grid-cols-12` (lista 7 kolumn + panel szczegółów 5) dostaje ~13% mniej miejsca na
desktopie. Bez zrzutów ekranu nie da się tego potwierdzić wizualnie — patrz „Pytania otwarte”.

## 6. Tokeny

| wariant | wystąpienia | pliki | docelowy prymityw |
|---|---|---|---|
| `LINEAR` (Projekty) | 11 plików importuje, 74 odwołania `LINEAR.*` łącznie | `features/projects/components/linear/linear.tokens.ts` | `components/ui/tokens.ts` |
| `LINEAR` (Klienci) — **bajt w bajt ta sama treść obiektu**, różnią się wyłącznie komentarze | 3 pliki importują | `features/clients/components/clients.tokens.ts` | `components/ui/tokens.ts` |

Poza samą duplikacją: `__test__/config/design-tokens.test.ts` trzyma obie ścieżki na sztywno
w `SURFACE_TOKEN_MODULES` i czyta je przez `readFileSync` — po usunięciu plików ten test
wywali się na braku pliku, więc lista musi wskazać `components/ui/tokens.ts`.

## Pytania otwarte — rozstrzygnięte przed Fazą 2

### P1. Zasięg asercji „najwyżej 3 warianty powierzchni” (Faza 4a)

**Decyzja: (a) — test liczy wyłącznie powierzchnie kart.**

Test z Fazy 4a ma policzyć warianty `rounded-* border-* bg-surface-*` w `features/**`
i asertować ≤ 3. Dziś jest ich **28 (100 wystąpień)** — i tylko część to karty.
Reszta to pigułki (`rounded-full`), wiersze list, pozycje dropdownów, nagłówek tabeli
(`rounded-t-2xl`), pola formularza buildera faktur. Sprowadzenie ich wszystkich do trzech
zestawów oznacza przeskinowanie m.in. `features/trips`, `features/settings`,
`features/invoices/components/builder/**` i większości `features/dashboard/**` — czyli
znacznie więcej niż „przyciski, kafelki, eyebrow, kontener, tokeny” z opisu zadania,
i realną zmianę wyglądu elementów, które kartami nie są.

Rozważane warianty:
- **(a)** liczyć tylko powierzchnie **kart** (literały z `rounded-xl`/`rounded-2xl` + border + `bg-surface-*`)
  i do trzech sprowadzić wyłącznie je — dziś takich kombinacji jest 12; pigułki i wiersze zostają;
- **(b)** liczyć wszystko, jak w literalnym brzmieniu — pełne przeskinowanie `features/**`;
- **(c)** inny podział.

Wybrano **(a)**. `rounded-md`, `rounded-lg`, `rounded-full` i `rounded-t-*` są poza licznikiem —
to pigułki, wiersze list, pozycje dropdownów i nagłówki tabel, nie karty. Objęte pliki:
`features/invoices/**` (10), `features/reports/**` (5), `features/clients/**` (2),
`features/trips/**` (1). Wyjazdy nie są sekcją z kolejności Fazy 3, ale siedzą
w `features/**`, więc wchodzą do zakresu razem z ostatnią sekcją.

### P2. Czwarta implementacja kafelka KPI (Pulpit)

**Decyzja: (a) — zmiana nazwy deklaracji na `EarningsKpi`, bez migracji do `StatTile`.**

`features/dashboard/components/sections/earnings/EarningsCard.tsx` deklaruje własny
`function KpiTile` — mikro-kafelek **wewnątrz** karty Zarobki: `rounded-lg p-2.5`,
wartość `text-sm`, ikona po lewej, `hint` po prawej. Zadanie wymienia trzy implementacje;
ta jest czwarta. Test 4a („w `features/**` nie ma deklaracji `function KpiTile`”) wymusza
jej ruszenie, ale wciśnięcie jej w `StatTile` albo wywróci pasek trzech kafelków w karcie
Zarobki (`StatTile` ma `p-3.5 sm:p-4` i wartość `text-3xl`), albo wymusi w `StatTile`
czwarty tryb rozmiarowy — czyli prop „na zapas” względem trzech migrowanych komponentów.

Rozważane warianty:
- **(a)** zostawić go w miejscu i zmienić nazwę deklaracji na `EarningsKpi` — test 4a przechodzi,
  Pulpit wygląda tak samo, ale czwarty wariant kafelka zostaje w kodzie;
- **(b)** dodać do `StatTile` prop `dense` i zmigrować — jeden kafelek w repo, ale pasek
  w karcie Zarobki zmienia geometrię;
- **(c)** zostawić deklarację i osłabić asercję 4a do `features/{clients,projects,invoices}`.

Wybrano **(a)**. To kafelek **zagnieżdżony w karcie**, nie kafelek sekcji — inna anatomia
(ikona po lewej, wartość nad etykietą, `text-sm`), a `StatTile` musiałby dostać czwarty tryb
rozmiarowy, którego trzy migrowane komponenty nie potrzebują (CLAUDE.md §2).

### P3. Zwężenie Faktur bez możliwości weryfikacji wizualnej

Zadanie mówi: „Jeśli tabela faktur albo builder się przez to rozjedzie — ZATRZYMAJ SIĘ i zapytaj”.
W tym środowisku nie da się uruchomić przeglądarki na aplikacji (brak Dockera → brak Supabase),
więc **nie mogę tego sprawdzić**. Zwężenie zrobię zgodnie z zadaniem i opiszę ryzyko,
ale weryfikacja zostaje po stronie człowieka.
