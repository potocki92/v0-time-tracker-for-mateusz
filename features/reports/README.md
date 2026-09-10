# Reports — modul analityczny wykonanej pracy

Raport odpowiada na jedno pytanie: **ile pracy wykonalem w wybranym okresie
i ile ta praca byla warta**. Nie jest przegladem faktur, cashflow ani planu —
to widok WYKONANIA.

---

## 1. Zakres odpowiedzialnosci

| Modul analizuje | Modul NIE analizuje |
| --- | --- |
| `work_entries` ze statusem `worked` i `entry_kind = real` | faktury, ich statusy, DSO, przeterminowania |
| godziny, ilosci akordowe, stawki, waluty | wplaty i cashflow |
| przekroje: klient / projekt / tag | plan (`entry_kind = predicted`) |
| rytm pracy i intensywnosc dni | prognozy i cele |

Analityka faktur mieszka osobno (`lib/finance/invoice-analytics`,
`app/[locale]/(app)/invoices/analytics`). Kopiowanie jej metryk tutaj tylko
po to, zeby raport wygladal na wiekszy, byloby duplikacja odpowiedzialnosci.
Gdyby kiedys powstal wspolny przeglad finansowy laczacy prace i faktury,
powinien byc osobna, swiadoma funkcja produktu.

---

## 2. Data flow

```
Supabase (RLS: auth.uid() = user_id)
        |  work_entries (zakres dat + klient + projekt w WHERE)
        |  clients, projects, profiles.eur_to_pln
        v
services/reports.fetchers.server.ts        <- server-only
        v
services/reports.service.server.ts         <- getReportsDatasetServer()
        v
app/api/reports/route.ts  (GET, private no-store)
        v
hooks/useReportsQuery.ts  (React Query, klucz QUERY_KEYS.reports)
        v
        ReportsDataset  { window, entries, clients, projects, eurRate }
        v
domain/report.ts -> buildReportModel(dataset, filters, today)     <- CZYSTA FUNKCJA
        |   dataset.ts   odsiew planu/nieobecnosci + normalizacja pieniedzy
        |   metrics.ts   KPI
        |   compare.ts   porownanie z poprzednim okresem
        |   trend.ts     kubelkowanie dzien/tydzien/miesiac
        |   breakdowns.ts klient / projekt / tag
        |   insights.ts  rytm pracy + heatmapa
        v
        ReportModel  (gotowe liczby, zero surowych wierszy)
        v
components/*  — rysuja, nie licza
```

Prefetch serwerowy (`app/[locale]/(app)/reports/page.tsx`) sklada **ten sam
klucz cache**, ktory zlozy klient, wiec pierwsze wejscie nie pobiera danych
drugi raz. Dlatego `today` jedzie propsem z serwera — gdyby klient liczyl
je sam, roznica stref albo polnoc miedzy renderami dalaby inny zakres.

---

## 3. Struktura katalogow

```
features/reports/
├── index.ts                 publiczne API klienckie (widok + skeleton + granica bledu)
├── server.ts                publiczne API serwerowe (dataset + parser query params)
├── domain/                  CZYSTA logika: bez Reacta, bez Supabase, bez UI
│   ├── index.ts             publiczne wejscie domeny
│   ├── types.ts             wszystkie kontrakty modulu
│   ├── range.ts             presety, zakresy, poprzedni okres, okno pobrania
│   ├── dataset.ts           definicja „wykonanej pracy" + normalizacja rekordow
│   ├── metrics.ts           KPI
│   ├── compare.ts           zmiany wzgledem poprzedniego okresu
│   ├── trend.ts             kubelkowanie szeregu czasowego
│   ├── breakdowns.ts        przekroje klient / projekt / tag
│   ├── insights.ts          rytm pracy i heatmapa
│   ├── filters.ts           kaskada „klient → jego projekty"
│   ├── worksites.ts         okresy pracy per projekt (miejsce, od-do, dni)
│   ├── export.ts            budowanie tresci CSV / JSON
│   └── report.ts            buildReportModel — jedyny orkiestrator
├── services/
│   ├── reports.columns.ts        jawne listy kolumn i sufity odczytu
│   ├── reports.fetchers.server.ts
│   ├── reports.service.server.ts
│   └── reports.query.ts          klucz + adres + konfiguracja zapytania
├── hooks/                   orkiestracja stanu — hooki NIE licza
│   ├── useReportsFilters.ts      filtry w query params (nuqs)
│   ├── useReportsQuery.ts        dataset z React Query
│   ├── useReportModel.ts         memoizacja buildReportModel
│   └── useReportsExport.ts       CSV / JSON / PDF
└── components/
    ├── ReportsContent.tsx        zlozenie strony
    ├── ReportsHeader.tsx
    ├── ReportsSkeleton.tsx
    ├── errors/                   granica bledu
    ├── shared/                   ReportCard, SegmentedControl, ReportEmptyState
    ├── filters/                  pasek filtrow (arkusz na mobile, inline na desktopie)
    ├── kpi/                      kafelek KPI + znacznik zmiany
    ├── trend/                    wykres (lazy) + mapowanie na dane wykresu
    ├── breakdown/                jeden wiersz dla trzech przekrojow
    ├── insights/                 rytm pracy + heatmapa
    ├── table/                    tabela (desktop) i lista kart (mobile)
    └── export/                   menu eksportu + szablony PDF (lazy) + ich wspolna oprawa
```

---

## 4. Public API

Trzy wejscia, nic wiecej:

| Wejscie | Co wystawia | Kto uzywa |
| --- | --- | --- |
| `@/features/reports` | `ReportsContent`, `ReportsSkeleton`, `ReportsContentBoundary` | trasa `/reports` |
| `@/features/reports/domain` | czyste typy i funkcje analityczne | trasa (parser filtrow), testy |
| `@/features/reports/server` | `getReportsDatasetServer`, `parseReportsSearchParams`, `reportsQueryOptions` | `app/api/reports`, prefetch w `page.tsx` |

Wszystko glebiej jest prywatne — pilnuje tego
`__test__/config/module-boundaries.test.ts` i regula ESLint
`no-restricted-imports`.

**Zaden inny feature nie importuje z `features/reports`.** Zaleznosci ida
w jedna strone: raport siega po `lib/*`, `components/ui/*`,
`components/common/*`, Supabase, React Query i i18n — nigdy po
`features/dashboard`, `features/calendar` czy `features/invoices`.

---

## 5. Najwazniejsze typy

| Typ | Rola |
| --- | --- |
| `ReportFilters` | stan filtrow: preset, zakres wlasny, klient, projekt, tag, porownanie |
| `ReportRange` | zakres **domkniety obustronnie** (`start` i `end` naleza do okresu) |
| `ReportsDataset` | to, co przychodzi z serwera: okno, wpisy, klienci, projekty, kurs EUR |
| `ReportRecord` | wpis po normalizacji — pieniadze policzone raz, etykiety rozwiazane raz |
| `ReportKpis` | szesc liczb overview |
| `ReportComparison` | poprzedni zakres + jego KPI + `MetricDelta` per metryka |
| `ReportTrend` | jednostka kubelka + punkty szeregu |
| `BreakdownItem` | pozycja przekroju: godziny, udzial, wartosc, stawka efektywna |
| `WorksitePeriod` | jeden projekt jako okres pracy: miejsce, od-do, dni z praca, godziny |
| `ReportModel` | komplet gotowy dla UI |

Konwencje: data kalendarzowa to zawsze `DateKey` (`"YYYY-MM-DD"`), nigdy `Date`.
Pieniadze to zawsze grosze/centy (int); sufiks `BaseMinor` znaczy „przeliczone
na walute raportu".

---

## 6. Jak licza sie pieniadze

Raport **nie ma wlasnej arytmetyki finansowej**. Kazda kwota przechodzi przez
`lib/finance`:

1. `fallbackFromClient(client)` — konfiguracja rozliczenia klienta jako fallback.
2. `calculateEntryMoney(entry, fallback)` — snapshot stawki z wpisu
   (`billing_rate`, `billing_currency`, `billing_work_type`), a gdy go nie ma
   (dane sprzed migracji snapshotow) — konfiguracja klienta. Akord liczy
   `resolveQuantity(entry) x stawka`, godzinowe `hours x stawka`.
3. `convert(money, 'PLN', eurRate)` — przeliczenie na walute raportu.

`REPORT_BASE_CURRENCY = 'PLN'`, a kurs bierze sie z `profiles.eur_to_pln`
konta (fallback 4,3). Bez jednej waluty suma mieszalaby jednostki.

**Wartosc pracy != przychod z faktur.** UI nazywa te metryke „Wartosc pracy"
i dopisuje „Wykonana praca, nie faktury"; PDF konczy sie ta sama notka.
Metryka wynika wylacznie z `work_entries` — nie wie nic o tym, co zostalo
wystawione ani oplacone.

---

## 7. Jak dziala billable

```ts
isBillable(entry, client) === resolveAppliedRate(entry, fallbackFor(client)) > 0
```

Czyli: stawka **faktycznie zastosowana**, a nie `entry.billing_rate > 0`.
Poprzednia wersja pomijala fallback do klienta, wiec cala historia sprzed
wprowadzenia snapshotow stawek pokazywala 0% billable mimo poprawnie
skonfigurowanego klienta. Test regresyjny:
`__test__/reports/dataset.test.ts` → „wpis bez `billing_rate` u klienta
z poprawna stawka JEST rozliczany".

`billableRatio` liczy sie po GODZINACH (godziny wpisow rozliczanych / wszystkie
godziny) i jest `null`, gdy godzin nie ma — sam akord nie ma czego dzielic.

---

## 8. Jak dziala porownanie

* Poprzedni okres ma **dokladnie te sama dlugosc** i przylega do biezacego
  od dolu: dla 1–30 wrzesnia to 2–31 sierpnia (`previousRange`).
* Wlaczenie porownania POSZERZA okno pobrania (`fetchWindowOf`), wiec zmienia
  klucz cache — to jedyny filtr, ktory to robi.
* Porownanie obejmuje **komplet szesciu KPI**, nie same godziny.
* `MetricDelta.ratio` jest `null`, gdy poprzednia wartosc to 0 — procent nie
  istnieje wtedy matematycznie. UI czyta `status`:
  `new` (bylo 0, jest cos), `empty` (bylo 0 i jest 0), `flat` (< 0,5%),
  `up`, `down`. Zadnego falszywego „0%".

---

## 9. Jak dziala kubelkowanie trendu

`resolveBucketUnit(days)`:

| Dlugosc zakresu | Jednostka |
| --- | --- |
| <= 31 dni | dzien |
| 32–182 dni | tydzien ISO |
| > 182 dni | miesiac |

Progi wynikaja z liczby slupkow czytelnych na ekranie ~375 px. Kubelki
powstaja dla **kazdego** dnia zakresu, takze pustego — inaczej wykres
skleilby tydzien bez pracy z sasiednim. Przy wlaczonym porownaniu kubelki
poprzedniego okresu dopasowuja sie POZYCYJNIE (liczone od konca), bo
kalendarzowe klucze nigdy by sie nie zgadzaly.

Liczbe etykiet osi X przycina `axisTickInterval`.

---

## 10. Jak dzialaja filtry

Stan filtrow zyje w **query params** (`nuqs`, `history: 'replace'`,
`clearOnDefault: true`), wiec raport jest adresowalny: odswiezenie strony
i wyslany link odtwarzaja ten sam widok. Parametry: `preset`, `from`, `to`,
`client`, `project`, `tag`, `compare`.

Serwer czyta te same parametry przez
`app/[locale]/(app)/reports/searchParams.ts` — to jedyny punkt styku miedzy
odczytem serwerowym a `useReportsFilters`. Zmieniajac nazwe parametru, zmien
oba miejsca.

Zakres dat, klient i projekt zawezaja zapytanie **w SQL**. Tag zostaje po
stronie domeny: filtrowanie po tagu w bazie zawezaloby liste dostepnych tagow
do jednego i select nie mialby czym sie wypelnic.

Zmiana klienta przechodzi przez `projectAfterClientChange`, wiec w adresie
nie zostaje projekt nalezacy do innego klienta.

---

## 11. Real vs predicted — invariant

**Jedna** definicja, w `domain/dataset.ts`:

```ts
isPerformedWork(entry) === entry.status === 'worked' && isRealEntry(entry)
```

Automat zapisu pracy tworzy wpis `real` takze dla dnia, dla ktorego istnieje
juz reczny plan (`predicted`) — liczenie obu naliczyloby ten sam dzien dwa
razy. Wpisy sprzed migracji `entry_kind` sa traktowane jak `real`
(`isRealEntry` z `lib/finance/realization`).

Filtr jest **zaimplementowany raz**: `buildPerformedWorkRecords` przepuszcza
przez niego caly dataset, zanim cokolwiek zacznie sumowac. Zapytanie SQL
zaweza ten sam warunek wylacznie jako optymalizacje transportu (plan nie
jedzie przez siec) — zrodlem prawdy zostaje domena.

Testy: `__test__/reports/dataset.test.ts` oraz
`__test__/work-automation/billing-integration.test.ts`.

---

## 12. Jak dodac nowe KPI

1. Dopisz pole do `ReportKpis` (`domain/types.ts`) i policz je w `computeKpis`.
2. Jesli ma byc porownywalne — dodaj nazwe do `ComparableMetric`,
   `COMPARABLE_METRICS` i `valueOf` w `domain/compare.ts`.
3. Dodaj klucze `kpi.<nazwa>.label` / `.hint` do `messages/{pl,en,de}/reports.json`.
4. Doloz `<ReportKpiCard>` w `components/kpi/ReportsKpis.tsx`.
5. Test w `__test__/reports/dataset.test.ts`.

Nie dodawaj KPI dlatego, ze da sie je policzyc — tylko dlatego, ze odpowiada
na pytanie uzytkownika.

## 13. Jak dodac przekroj (breakdown)

1. Rozszerz `BreakdownDimension` i `keysOf` w `domain/breakdowns.ts`.
2. Dodaj wpis do `buildAllBreakdowns`.
3. Dodaj etykiete `breakdown.<nazwa>` w trzech plikach tlumaczen.
4. Doloz opcje do `<SegmentedControl>` w `ReportsBreakdownSection`.

Nie tworz nowego komponentu wiersza — `BreakdownRow` obsluguje kazdy przekroj
o tej samej strukturze informacji.

## 14. Eksporty

Raport oddaje dane w dwoch celach:

| Eksport | Zawartosc | Dla kogo |
| --- | --- | --- |
| CSV / JSON / PDF | pelne wpisy, KPI, przekroje, kwoty | wlasna analiza |
| Zestawienie miejsc pracy (PDF / CSV) | jeden wiersz na projekt: miejsce, od-do, dni z praca, godziny | ksiegowa (np. przedluzenie A1) |

Zestawienie miejsc pracy liczy `domain/worksites.ts`:

* grupuje po PROJEKCIE, bo to `projects.address` niesie adres wykonywania pracy;
* `from`/`to` to skrajne dni Z PRACA w tym projekcie wewnatrz zakresu raportu,
  a nie granice samego zakresu;
* `workedDays` liczy ROZNE dni, nie wpisy;
* wiersz sumy bierze dni i godziny z `ReportKpis`, a NIE z dodania kolumny —
  ten sam dzien przepracowany w dwoch projektach jest jednym dniem pracy;
* nie ma tu kwot: wniosek o A1 pyta o czas i miejsce, a pieniadze maja
  wlasne eksporty.

Projekt bez adresu i wpisy bez projektu nie znikaja — dostaja etykiete
zastepcza z i18n, zeby godziny sie zgadzaly.

### Jak dodac eksport

1. Zbuduj TRESC czysta funkcja w `domain/export.ts` (etykiety wchodza argumentem).
2. Dodaj akcje w `hooks/useReportsExport.ts` — ciezkie zaleznosci przez
   `await import(...)`, nigdy statycznie.
3. Dodaj pozycje w `components/export/ReportsExportMenu.tsx` i klucze
   `export.*` w tlumaczeniach.
4. Test formatu w `__test__/reports/export.test.ts`.

---

## 15. Tlumaczenia

`messages/pl/reports.json`, `messages/en/reports.json`, `messages/de/reports.json`.
Przestrzen `reports` jest zarejestrowana w `i18n/messages.ts` i wysylana do
przegladarki przez `app/[locale]/(app)/layout.tsx`.

Zasady (patrz `CLAUDE.md` i `docs/i18n.md`):

* zaden tekst dla uzytkownika nie stoi w komponencie — takze `aria-label`,
  `sr-only`, tooltipy, naglowki CSV, toasty i nazwy plikow;
* liczba mnoga tylko przez ICU (`{count, plural, …}`);
* **nazwy klientow, projektow i tagow nie sa tlumaczone** — to dane. Etykiety
  zastepcze („Bez przypisania", „Bez tagu") sa tekstem UI, dlatego domena
  zwraca `label: null`, a podstawia je komponent.

Komplet kluczy we wszystkich jezykach pilnuje `__test__/i18n/messages.test.ts`.

---

## 16. Wydajnosc

* Raport pobiera **tylko swoje okno**. Nie jedzie na 24-miesiecznym oknie
  dashboardu, wiec zakres „poprzedni rok" dziala, a „ostatnie 7 dni" nie
  sciaga dwoch lat historii.
* Dataset jest filtrowany RAZ, w `buildReportModel`. Zadna sekcja nie
  przechodzi po zbiorze po swojemu.
* `useReportModel` memoizuje caly model — wykres nie przelicza agregacji
  przy kazdym renderze.
* Ciezkie zaleznosci ida osobnymi chunkami: **Recharts** przez `next/dynamic`
  w `ReportsTrendSection`, **@react-pdf/renderer** i szablon PDF przez
  `await import(...)` w `useReportsExport`. Dzieki temu wejscie na `/reports`
  nie pobiera ani wykresow, ani generatora PDF.
* Tabela szczegolowa stronicuje po 15 wierszy — DOM nie rosnie z historia.
* Tabela **nie** uzywa `@tanstack/react-table` ani wspolnego `<DataTable>`:
  nie ma filtrowania, zaznaczania, przestawiania ani chowania kolumn, czyli
  niczego, za co placi sie ta biblioteka, a `<DataTable>` dokladalby dnd-kit
  i wymuszal poziomy scroll na telefonie.

Budzet trasy pilnuje `performance-budgets.json` + `npm run perf:budget`.

---

## 17. Stany brzegowe

| Stan | Zachowanie |
| --- | --- |
| brak jakichkolwiek wpisow w oknie | pusty stan „nie ma jeszcze czego raportowac" |
| wpisy sa, ale filtr nic nie zwraca | pusty stan „brak danych dla tych filtrow" |
| bardzo malo danych (<= 3 wpisy) | notka, ze srednie i trendy moga mylic |
| blad pobrania | `ReportsContentBoundary` |
| trwa odswiezanie po zmianie filtra | raport przygasa (`aria-busy`), nie znika do skeletonu |
| pierwsze ladowanie | `ReportsSkeleton` odwzorowujacy uklad docelowy |

---

## 18. Testy

```bash
npm run test -- __test__/reports          # sama analityka i zlozenie strony
npm run test                              # calosc
```

| Plik | Co pilnuje |
| --- | --- |
| `__test__/reports/range.test.ts` | presety, inclusivity zakresow, poprzedni okres, okno pobrania |
| `__test__/reports/dataset.test.ts` | real vs predicted, PLN/EUR, akord, fallback stawki, billable, KPI, filtry |
| `__test__/reports/analytics.test.ts` | porownanie (w tym previous = 0), kubelkowanie, breakdowny, streak, dni tygodnia, heatmapa |
| `__test__/reports/export.test.ts` | format CSV/JSON, zestawienie miejsc pracy, nazwy plikow, kaskada klient → projekt |
| `__test__/reports/reports-content.test.tsx` | zlozenie strony: filtry z URL → klucz cache → sekcje UI |
| `__test__/work-automation/billing-integration.test.ts` | invariant `entry_kind` wspolnie z automatem zapisu pracy |

---

## 19. Jak bezpiecznie usunac ten modul

Raport jest wyspa: **zaden inny feature nie importuje z `features/reports`**.
Zaleznosci, ktore zostaja, sa wylacznie po stronie rejestrow aplikacji —
segment `reports` jest tam pozycja na liscie, nie kodem raportu.

Kolejnosc krokow (zweryfikowana `npm run typecheck` po kazdym z nich):

1. **Kod modulu i trasy**
   * `rm -rf features/reports`
   * `rm -rf "app/[locale]/(app)/reports"` (page, loading, searchParams)
   * `rm -rf app/api/reports`
2. **Tlumaczenia**
   * `rm messages/{pl,en,de}/reports.json`
   * `i18n/messages.ts`: usun `'reports'` z `MESSAGE_NAMESPACES` i trzy wpisy
     `reports:` z `LOADERS`
   * `app/[locale]/(app)/layout.tsx`: usun `'reports'` z `pickMessages`
3. **Rejestr obszaru roboczego** — segment `reports` wystepuje w typie
   `WorkspaceSegment`, wiec TypeScript wskaze KAZDE miejsce, ktore trzeba
   tknac:
   * `lib/workspace/sections.ts` (typ + wpis listy)
   * `lib/seo/workspace-metadata.ts` (`case 'reports'`)
   * `app/[locale]/(app)/_layout/config/nav.config.ts` (ikona)
   * `components/seo/json-ld.tsx`
4. **Landing** — marketingowa replika ekranu raportu jest niezalezna od tego
   modulu (ma wlasne teksty w `marketing.app.reports`), ale odwoluje sie do
   tego samego segmentu:
   * `app/[locale]/(marketing)/_landing/product/AppFrame.tsx`
   * `app/[locale]/(marketing)/_landing/sections/ProductJourney.tsx`
   * `app/[locale]/(marketing)/_landing/sections/EverythingElse.tsx`
   * `app/[locale]/(marketing)/_landing/product/screens/ReportsScreen.tsx`
     (caly plik) i klucze `marketing.app.reports`
5. **Testy i budzety**
   * `rm -rf __test__/reports`
   * `__test__/work-automation/billing-integration.test.ts`: usun sekcje
     „raporty nie naliczaja planu i wykonania dla tej samej daty" (reszta
     pliku pilnuje fakturowania i zostaje)
   * usun wpis trasy z `performance-budgets.json`
6. **Opcjonalnie** `QUERY_KEYS.reports` / `QUERY_CONFIG.reports` w `lib/query`.

Po tych krokach `npm run typecheck`, `npm run lint` i `npm run build`
przechodza bez przepisywania dashboardu, kalendarza czy faktur — zaden
z tych modulow nie wie o istnieniu raportu.
