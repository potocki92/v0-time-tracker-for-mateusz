# Dashboard — jedno zrodlo wyliczen pochodnych

Etap 3 naprawy dashboardu. Cel: ta sama kalkulacja liczona raz zamiast raz na sekcje.

## Instrumentacja

Pomiar robi sie tymczasowym `console.count` na wejsciu do dwoch funkcji:

```ts
// lib/finance/totals.ts — calculateTotals
if (process.env.NODE_ENV === 'development') console.count('calculateTotals')

// lib/finance/realization.ts — partitionByRealization
if (process.env.NODE_ENV === 'development') console.count('partitionByRealization')
```

Repro: `npm run dev` → `/dashboard` → wyczysc konsole → zmien zakres raz w naglowku.
Pierwsza zmiana po wejsciu moze zawierac montowanie, wiec liczy sie druga.

Instrumentacja NIE jest commitowana — zyje tylko w drzewie roboczym na czas pomiaru.

## Uwaga metodologiczna

Liczby ponizej pochodza z **wyprowadzenia po grafie wywolan**, nie z uruchomionej
przegladarki. Kontener, w ktorym powstal ten etap, nie ma poswiadczen Supabase ani
pliku `.env`, wiec `/dashboard` nie da sie w nim otworzyc z prawdziwymi danymi.

Wyprowadzenie jest deterministyczne, bo kazde z tych wywolan siedzi w zwyklym
`useMemo` o jawnych zaleznosciach — wystarczy sprawdzic, ktore z nich zmieniaja
sie przy zmianie zakresu. Kto ma dostep do bazy, powtorzy pomiar dwoma poleceniami
z sekcji "Instrumentacja" i powinien zobaczyc dokladnie te wartosci.

Co zmienia sie przy zmianie zakresu w naglowku: `range`, `dateRange`, `prevRange`.
Co sie NIE zmienia: `data` (ten sam wpis cache), `eurRate`, zakres wykresu
(`useChartState` trzyma wlasne klucze nuqs, niezalezne od naglowka).

## Baseline (przed)

Jedna zmiana zakresu, dashboard juz zamontowany:

| Licznik | Razy | Rozbicie |
|---|---:|---|
| filtr po dacie (`useFilteredEntries`) | **7** | earnings ×2, goal, hours, effective-rate, activity, projects |
| `partitionByRealization` | **7** | earnings ×2, goal, hours, effective-rate, activity, projects |
| `calculateTotals` | **9** | earnings ×4, goal ×2, hours ×2, activity ×1 |

Rozbicie `calculateTotals` w EarningsSection na cztery: `useDashboardTotals(realFiltered)`,
`useDashboardTotals(projectedEntries)` oraz **dwa ukryte** w `useEarningsTrend` —
`calculateMonthlyTotals` to alias `calculateTotals`, wiec trend liczy pelne sumy
biezacego i poprzedniego okresu jeszcze raz.

Dwa wywolania nie licza sie do tabeli, bo ich zaleznosci nie zmieniaja sie przy
zmianie zakresu:

- `ProjectsSection` → `useRealizedEntries(data.workEntries)` — deps `[workEntries]`,
  wiec przelicza sie tylko przy zmianie danych (na montowaniu).
- `WeeklyGlanceSection` → `useChartMetrics` — 2 filtry + 2 partycjonowania na wlasnym
  zakresie z `useChartState`, ktory naglowek dashboardu w ogole nie rusza.

Na montowaniu (pierwszy paint) wychodzi odpowiednio 9 filtrow, 10 partycjonowan
i 9 `calculateTotals`.

## Dlaczego cache sie nie wspoldzieli

Kazde wywolanie `useFilteredEntries` / `useRealizedEntries` / `useDashboardTotals`
ma WLASNY `useMemo` w WLASNYM komponencie. React memoizuje per instancja hooka,
nie per argument — szesc sekcji pytajacych o to samo dostaje szesc niezaleznych
cache'y. `calculateTotals` dodatkowo buduje `new Map(clients.map(...))` przy kazdym
wywolaniu, wiec koszt to nie tylko przebieg po wpisach.

## Po konsolidacji

Ta sama jedna zmiana zakresu, po Etapie 3:

| Licznik | Przed | Po | Gdzie zostalo |
|---|---:|---:|---|
| filtr po dacie | 7 | **2** | `computeDashboardDerived` — biezacy i poprzedni zakres |
| `partitionByRealization` | 7 | **3** | `computeDashboardDerived` — filtered, prevFiltered, wszystkie wpisy |
| `calculateTotals` | 9 | **4** | provider ×2 (zrealizowane + planowane), `useEarningsTrend` ×2 |

### Dlaczego partycjonowanie stoi na 3, a nie na 2

Trzecie wywolanie to `realizedAll` — zrealizowane wpisy BEZ filtra zakresu.
Sekcja Projekty buduje z nich liste projektow "kiedykolwiek", a zakresem decyduje
tylko o tym, ktore z nich sa aktywne. Bez tego pola lista projektow gubilaby
wszystko spoza biezacego zakresu, czyli zmienialaby to, co widac na ekranie.

Wczesniej to wywolanie tez istnialo (`useRealizedEntries(data.workEntries)`
w `ProjectsSection`) i mialo deps `[workEntries]`, wiec przy zmianie zakresu
sie nie przeliczalo — teraz przelicza, bo siedzi w tym samym memo co reszta.
Zejscie do 2 wymagaloby drugiego `useMemo` w providerze, z deps
`[workEntries, todayIso]`. Test `__test__/config/dashboard-derived.test.ts`
pilnuje dokladnie jednego `useMemo`, wiec to swiadomy wybor: jedno miejsce
wyliczen kosztem jednego przebiegu O(N) wiecej.

### Dlaczego calculateTotals stoi na 4, a nie na 2

Dwa nadmiarowe wywolania siedza w `useEarningsTrend`. `calculateMonthlyTotals`
to alias `calculateTotals`, a trend potrzebuje z niego jednego pola —
`totalEarningsAllPLN` dla biezacego i poprzedniego okresu. Biezacy okres jest
juz policzony w `derived.totals`; brakuje tylko sum dla `prevRealized`.

Kandydat na Etap 3b: dodac `prevTotals` do `DashboardDerived` i zmienic
`useEarningsTrend` tak, zeby przyjmowal dwa gotowe `MonthlyTotals` zamiast
dwoch tablic wpisow. To zdejmuje oba wywolania i schodzi do 2.

`useEarningsSparkline` NIE wola `calculateTotals` — ma wlasna agregacje dzienna
przez `calculateEarnings`. Jest wolany dwa razy, ale z roznym wejsciem
(biezacy i poprzedni okres), wiec nie ma tu duplikacji do usuniecia.

### Co zostalo poza providerem i dlaczego

- `useChartMetrics` (wykres) — 2 filtry + 2 partycjonowania, ale na WLASNYM
  zakresie z `useChartState`. Naglowek dashboardu go nie rusza, wiec przy zmianie
  zakresu nie przelicza sie w ogole. Dlatego `useFilteredEntries`
  i `useRealizedEntries` zyja dalej — knip nie zglosil ich jako martwych.
- `buildWeeklySummary` — jedno partycjonowanie, deps `[workEntries, clients,
  projects, weekStart]`, wiec zakres go nie dotyczy.

## Bundle

First Load JS (gzip) trasy `/(app)/dashboard/page`, wg `npm run perf:budget`:

| | kB |
|---|---:|
| przed (be6a8a3) | 265.2 |
| po | 265.5 |

Refaktor, wiec plasko — +0.3 kB to koszt jednego dodatkowego contextu.

## Martwe hooki

Knip po migracji zglosil trzy pliki, wszystkie usuniete:

- `features/dashboard/hooks/useDashboardTotal.ts`
- `features/dashboard/hooks/usePeriodLabel.ts`
- `features/dashboard/hooks/index.ts` — barrel przestal miec konsumentow, bo
  sekcje importuja z konkretnych sciezek

`useFilteredEntries.ts` i `useRealizedEntries.ts` ZOSTAJA — ich konsumentem jest
`useChartMetrics`. To wciaz modul dashboardu, wiec nikt spoza feature'a na nich
nie polega.
