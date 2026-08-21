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
