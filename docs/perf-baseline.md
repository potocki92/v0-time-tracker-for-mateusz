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
