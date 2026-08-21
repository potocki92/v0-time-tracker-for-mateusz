# Dashboard — CLS i koszt hydracji

Etap 4. Miara efektu dla zmian w skeletonie, granicach Suspense
i `refetchOnWindowFocus`.

## Status pomiarów

**Kolumny „przed" i „po" są puste — pomiaru nie wykonano.**

Sesja, w której powstał ten dokument, biegła w kontenerze bez dostępu do bazy:
brak `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, brak
lokalnej Supabase, brak konta z seeda. `/dashboard` siedzi za middleware
(`middleware.ts` → matcher `/dashboard/:path*`), więc strona nie otwiera się
nawet do odczytu. `npm run build` przechodzi, `npm run e2e` nie.

Wpisanie tu zmyślonych liczb byłoby gorsze niż pusta tabela: to ma być miara
efektu, a nie ozdoba. Procedura poniżej jest gotowa do uruchomienia na
maszynie z bazą — wypełnij obie kolumny i zacommituj.

Co udało się ustalić bez przeglądarki, z modelu pudełkowego klas Tailwinda,
jest w sekcji „Wysokości policzone statycznie".

## Procedura

### 1a. CLS

```bash
npm run build && npm run start
```

`/dashboard`, twarde odświeżenie (Ctrl+Shift+R), w konsoli:

```js
new PerformanceObserver((list) => {
  let total = 0
  for (const e of list.getEntries()) if (!e.hadRecentInput) total += e.value
  console.log('CLS:', total.toFixed(4))
}).observe({ type: 'layout-shift', buffered: true })
```

Osobno przy 390 px i 1440 px. Twarde odświeżenie za każdym razem — `buffered: true`
zbiera przesunięcia od startu nawigacji, więc miękki reload zaniża wynik.

Skeleton pokazuje się na KAŻDYM zimnym wejściu, nie tylko przy pustym cache:
`app/(app)/dashboard/page.tsx` trzyma `await queryClient.prefetchQuery` w
`DashboardData`, a nie w default exporcie, więc `<Suspense fallback={<DashboardSkeleton />}>`
jest granicą żywą — powłoka segmentu leci od razu, dane dostreamowują się później.

### 1b. Koszt hydracji

DevTools → Performance → nagraj ładowanie `/dashboard` z `Fast 4G` i
`4× CPU slowdown`.

### Wyniki

| Metryka | przed | po |
|---|---|---|
| CLS @ 390 px | — | — |
| CLS @ 1440 px | — | — |
| Najdłuższe zadanie main thread | — ms | — ms |
| Łączny czas Scripting | — ms | — ms |

## Wysokości policzone statycznie

Skala typografii jest płynna (`clamp(..., ... + Nvw, ...)` w `app/globals.css`),
więc wysokość linii zależy od szerokości okna. Wartości poniżej policzone dla
**1440 px**; dla 390 px podane tam, gdzie różnica przekracza kilka pikseli.

### Komponenty skeletonu — wysokość dokładna

Bloczki mają stałe wysokości, więc to nie jest szacunek.

| Komponent | wysokość |
|---|---|
| `KpiSkeleton` | 286 px |
| `InvoicesSkeleton` | 221 px |
| `ChartSkeleton` | 188 px |
| `StatsSkeleton` | 92 px |

### Nagłówek — wysokość dokładna

| Element | 390 px | 1440 px |
|---|---|---|
| `LinearTopBar` | 0 (`hidden`) | 49 px |
| `HeroGreeting` | 124 px | 111 px |

49 px dla topbara: `py-2` (16) + `h-8` przycisków (32) + `border-b` (1).
Zgadza się z komentarzem przy `xl:top-16` w `DashboardContent`.

`HeroGreeting` jest na mobile WYŻSZY niż na desktopie mimo mniejszej czcionki,
bo akapit `sm:hidden` z tekstem „Tak prezentuje się …" dokłada 21 px, których
od `sm:` nie ma (tam ta sama treść wjeżdża inline w `<h1>`).

### Realne karty — szacunek

Karty nie mają ani jednej stałej wysokości w klasach: liczy je treść. Poniższe
wartości to model pudełkowy przy pełnych danych i 1440 px, nie pomiar.

| Sekcja | szacunek |
|---|---|
| `EarningsSection` | ~490 px |
| `EffectiveRateSection` | ~310 px (4 klientów; mniej klientów = niżej) |
| `GoalSection` | ~270 px |

## Znaleziska poboczne

- `features/dashboard/components/sections/hours/HoursCard.tsx` rysuje heatmapę
  jako `grid-cols-7` komórek `aspect-square`. W kolumnie głównej przy 1440 px
  karta ma ~912 px, więc komórka wychodzi ~120 px i JEDEN tydzień heatmapy to
  ~120 px wysokości. Przy widoku miesiąca to ~600 px samej heatmapy. Nie jest to
  regresja Etapu 2 (przed nim kontener nie miał max-width, więc było jeszcze
  szerzej), ale jest to główny powód, dla którego `HoursSection` jest najwyższą
  kartą dashboardu — i żaden skeleton tego nie odwzoruje.

- `features/dashboard/components/sections/goal/MonthlyGoalCard.tsx:35` ma
  `stroke="#1a1a1a"` na `<circle>`. Strażnik z Etapu 1
  (`design-tokens.test.ts` → „nie hardkoduje powierzchni ani konturów panelu")
  szuka literałów tylko we wzorcach klas Tailwinda (`bg|border|divide|ring-[#…]`),
  więc atrybut SVG mu umknął. Ten kontur nie chodzi za motywem.
