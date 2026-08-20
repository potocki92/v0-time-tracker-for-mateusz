# Baseline wydajnosci nawigacji panelu

Pomiar wykonany PRZED optymalizacja nawigacji miedzy sekcjami panelu.
Sluzy jako punkt odniesienia dla FAZY 7 (porownanie rozmiarow bundle po zmianach).

- Data pomiaru: 2026-08-20
- Next.js 15.5.9, React 19.1.0, TanStack Query v5
- Komenda: `npm ci && npm run build`
- Testy jednostkowe przed zmianami: **34 pliki / 425 testow — wszystkie zielone**

## Objaw

Kazde przejscie miedzy sekcjami panelu (`/dashboard` → `/calendar` → `/dashboard`)
pokazuje pelny skeleton, nawet gdy React Query ma dane w cache. Powrot na sekcje
odwiedzona 3 sekundy wczesniej laduje sie tak samo dlugo jak pierwsze wejscie.

## First Load JS — trasy `(app)`

| Trasa | Size | First Load JS |
| --- | ---: | ---: |
| `/calendar` | 272 B | 204 kB |
| `/clients` | 286 B | 302 kB |
| `/dashboard` | 282 B | 228 kB |
| `/invoices` | 41.4 kB | 286 kB |
| `/invoices/analytics` | 104 kB | 215 kB |
| `/projects` | 344 B | 187 kB |
| `/reports` | 2.09 kB | 171 kB |

## Pozostale trasy (kontekst)

| Trasa | Size | First Load JS |
| --- | ---: | ---: |
| `/` | 30.1 kB | 155 kB |
| `/_not-found` | 1 kB | 103 kB |
| `/auth/error` | 170 B | 106 kB |
| `/auth/login` | 1.05 kB | 138 kB |
| `/auth/sign-up` | 1.36 kB | 139 kB |
| `/auth/sign-up-success` | 170 B | 106 kB |

## Shared / middleware

| Pozycja | Rozmiar |
| --- | ---: |
| First Load JS shared by all | 102 kB |
| `chunks/1255-*.js` | 45.6 kB |
| `chunks/4bd1b696-*.js` | 54.2 kB |
| pozostale wspolne chunki | 2.52 kB |
| Middleware | 85.7 kB |

Wszystkie trasy `(app)` sa oznaczone jako `ƒ (Dynamic)` — server-rendered on demand.
To wynika z tego, ze Supabase server client czyta `cookies()`, wiec segment nie moze
byc prerenderowany. W Next 15 domyslne `experimental.staleTimes.dynamic` wynosi `0`,
wiec takie segmenty **w ogole nie trafiaja do Router Cache klienta** — i to jest
glowna przyczyna objawu opisanego wyzej.

---

# Po optymalizacji

Pomiar po fazach 1-7 (`npm run verify`). Testy jednostkowe: **35 plikow / 437 testow**.

## First Load JS — trasy `(app)`

| Trasa | Size przed | Size po | First Load JS przed | First Load JS po |
| --- | ---: | ---: | ---: | ---: |
| `/calendar` | 272 B | 272 B | 204 kB | 204 kB |
| `/clients` | 286 B | 286 B | 302 kB | 302 kB |
| `/dashboard` | 282 B | 282 B | 228 kB | **227 kB** |
| `/invoices` | 41.4 kB | 41.6 kB | 286 kB | 286 kB |
| `/invoices/analytics` | 104 kB | 104 kB | 215 kB | 215 kB |
| `/projects` | 344 B | 342 B | 187 kB | 187 kB |
| `/reports` | 2.09 kB | 2.09 kB | 171 kB | 171 kB |

Nowe trasy (route handlery odczytu, FAZA 5) — 161 B / 103 kB kazda:
`/api/dashboard`, `/api/calendar`, `/api/clients`, `/api/projects`.

Middleware: 85,7 kB → 85,6 kB.

`npm run perf:budget:init` po zmianach wyprodukowal identyczny
`performance-budgets.json` — spadek byl za maly, zeby ruszyc ktorykolwiek limit.

## Czego szukac w tej tabeli — i czego w niej nie ma

Rozmiar bundle **nie jest** miara tej optymalizacji i celowo prawie sie nie
zmienil. Objawem byl czas i liczba round-tripow przy nawigacji, nie waga JS.
Bundle mierzymy tylko po to, by potwierdzic, ze zmiany niczego nie *dolozyly*.

## Co dala ktora faza

| Faza | Zmiana | Efekt |
| --- | --- | --- |
| 1 | `experimental.staleTimes` (dynamic 120 s, static 300 s) | Powrot na sekcje odwiedzona w ciagu 2 minut nie robi zadania RSC ani nie pokazuje skeletonu. Glowna przyczyna objawu. |
| 2 | `await prefetchQuery` zeszlo z default exportu do komponentu w `<Suspense>` | Powloka segmentu leci do przegladarki natychmiast, zamiast czekac na najwolniejsze zapytanie Supabase. `<Suspense>` na stronach przestal byc martwym kodem. |
| 3 | `getClaims()` zamiast `getUser()` w middleware | Minus jeden round-trip do GoTrue na KAZDYM requescie RSC — **pod warunkiem** wlaczenia asymetrycznych kluczy JWT (patrz nizej). |
| 4 | — | Pominieta: region projektu Supabase jest nieznany z poziomu repo. |
| 5 | Odczyt na route handlerach GET zamiast Server Actions | Odpowiedz na "podaj dane" nie niesie juz przerenderowanego payloadu RSC calej trasy; odczyty przestaly byc serializowane jeden po drugim. |
| 6 | `revalidatePath` → `invalidateQueries` | Mutacja odswieza wlasna domene zamiast kasowac caly Router Cache klienta. Bez tego FAZA 1 dawalaby zysk tylko do pierwszej edycji. |
| 7 | `data-testid` na skeletonach, `e2e/navigation.spec.ts`, usuniete 13 martwych `<Suspense>` w `DashboardContent` | Regresja objawu jest teraz pilnowana testem; znika mnozenie warstw skeletonow. |

## Warunek dla FAZY 3 — do zrobienia w panelu Supabase

Authentication → JWT Keys → wlacz asymetryczne klucze (ECC P-256) i wykonaj
rotacje. Przy kluczu symetrycznym `getClaims()` robi fallback na wywolanie
sieciowe i FAZA 3 nie daje zadnego zysku (ale tez niczego nie psuje).

## Otwarte — FAZA 4

Region projektu Supabase (Project Settings → General → Region) trzeba odczytac
recznie. Jesli baza stoi w EU, do `app/(app)/layout.tsx` nalezy dopisac
`export const preferredRegion` — `fra1` dla `eu-central-1`, `dub1` dla
`eu-west-1`, `lhr1` dla `eu-west-2`. Przy `us-east-1` nie zmieniamy nic:
domyslny region Vercela to `iad1`, czyli juz obok bazy.
