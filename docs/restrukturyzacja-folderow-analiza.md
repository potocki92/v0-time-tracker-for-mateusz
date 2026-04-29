# Rekomendowana architektura dla tego projektu (micro‑SaaS modules)

## TL;DR
Najbardziej opłacalny styl dla Twoich wymagań to:

**Modular Monolith + Vertical Slice Architecture + Ports & Adapters (na poziomie modułów)**

czyli:
- 1 repo / 1 deploy (tanie i szybkie utrzymanie),
- sekcje (`dashboard`, `clients`, `invoices` itd.) jako **izolowane mikro‑SaaSy w kodzie**,
- każda sekcja ma własne UI/use-case/query/local state,
- zapisy do DB i integracje zewnętrzne realizowane przez wspólną warstwę platformową **poza sekcjami**,
- brak bezpośrednich importów między sekcjami.

To daje separację jak w microservices, ale koszt operacyjny pozostaje jak w jednym produkcie.

---

## Dlaczego to najlepsze właśnie tutaj
Twoje założenia:
1. Dashboard działa osobno, Clients działa osobno.
2. Główne pobieranie danych dzieje się poza sekcjami.
3. Sekcje mają działać na local state / React Query, gdy potrzebne.
4. Zapisy do bazy mają być poza „micro‑saasami”.
5. Brak dostępu jednej sekcji do drugiej.

To jest praktycznie definicja **modułowego monolitu z twardymi granicami modułów**.
W tym modelu unikasz kosztów prawdziwych mikroserwisów (devops, observability, deploymenty, contracts sieciowe), a zachowujesz silną izolację domen.

---

## Docelowy model warstw

## 1) `app/` = tylko routing i composition root
- Strony/layoute montują moduł.
- Brak logiki biznesowej.
- Brak bezpośrednich zapytań do DB.

## 2) `modules/<domain>/` = każdy mikro‑SaaS jako Vertical Slice
Przykład:
- `modules/dashboard/`
- `modules/clients/`
- `modules/invoices/`

W każdym module:
- `ui/` – komponenty tylko tej sekcji,
- `application/` – use-cases (np. `loadDashboardKpis`, `createClient`),
- `domain/` – typy, reguły, polityki,
- `infra/` – adaptery read model (React Query hooks + mapowanie DTO),
- `state/` – local store (zustand) jeśli potrzebny.

**Zasada:** moduł nie importuje kodu innego modułu.

## 3) `platform/` = współdzielone I/O poza modułami
- `platform/db` – klient DB i repozytoria techniczne,
- `platform/api` – klienci HTTP,
- `platform/events` – event bus (opcjonalnie),
- `platform/cache` – query client setup,
- `platform/auth` – sesja, tokeny, guardy.

Tu są „zapisy do bazy poza micro‑saasami” – dokładnie jak chcesz.
Moduł woła tylko **port** (`ClientWritePort`), a implementacja siedzi w `platform/`.

## 4) `shared/` = tylko truly-shared
- design system,
- prymitywy UI,
- utilsy bez logiki domenowej.

Jeśli coś jest specyficzne dla `clients`, nie trafia do `shared`.

---

## Wzorzec przepływu danych zgodny z Twoim opisem

### Odczyt
- Route -> module use-case -> module query hook -> platform read adapter -> DB/API.
- Cache i re-fetch przez React Query.
- Możliwy fallback do local state.

### Zapis
- UI modułu -> `application` command (np. `updateClient`)
- command woła `WritePort` (interfejs)
- implementacja `WritePort` w `platform/db` robi zapis
- moduł dostaje wynik i invaliduje swoje query.

Sekcje pozostają odseparowane, bo każda ma własne command/query i własne klucze cache.

---

## Kontrakt izolacji (najważniejsze)
Aby to działało długoterminowo, dodaj twarde reguły:

1. **Zakaz importów cross-module**
   - `modules/dashboard/*` nie może importować `modules/clients/*`.
2. **Dostęp do DB tylko przez `platform/*`**
   - moduły nie używają bezpośrednio klienta Supabase.
3. **Każdy moduł ma public API**
   - np. `modules/clients/index.ts` eksportuje tylko to, co route potrzebuje.
4. **Osobne query keys per moduł**
   - brak współdzielonych key-space między domenami.
5. **Feature flags / billing / limity per moduł** (jeśli chcesz micro‑SaaS biznesowo).

---

## Opłacalność vs alternatywy

### Lepsze niż „czyste microservices” teraz
- dużo mniejszy koszt utrzymania,
- łatwiejsze wdrożenia,
- mniej problemów transakcyjnych i spójności danych.

### Lepsze niż „flat feature folders bez reguł”
- realna izolacja sekcji,
- mniejsza regresja,
- szybszy onboarding i refactor.

---

## Plan wdrożenia (praktyczny, niski koszt)

1. **Najpierw reguły granic**
   - lint boundaries + aliasy (`@modules/*`, `@platform/*`, `@shared/*`).
2. **Wydzielenie `platform/`**
   - przenieś zapisy DB i integracje techniczne.
3. **Pionowe domknięcie 1 modułu pilotowego**
   - np. `clients` jako pierwszy pełny vertical slice.
4. **Powtórzenie wzorca dla `dashboard`, `invoices`**.
5. **Dopiero potem kosmetyczne porządki folderów**.

---

## Finalna rekomendacja
Dla Twojego celu (micro‑SaaS style, izolowane sekcje, centralny odczyt/zapis poza sekcjami) **najbardziej opłacalna architektura to modularny monolit z vertical slices i ports/adapters**.

To daje:
- izolację domenową,
- kontrolę kosztów,
- prostszy rozwój niż mikroserwisy,
- gotowość do późniejszego wycięcia sekcji do osobnych usług, jeśli biznes tego zażąda.


---

## Gdzie umieścić Landing Page w tej architekturze?
Najlepiej trzymać landing **poza modułami micro‑SaaS**, bo to warstwa marketingowa, nie domena aplikacji zalogowanej.

Rekomendacja:
- `app/(marketing)/page.tsx` – główny landing,
- `app/(marketing)/pricing/page.tsx`, `app/(marketing)/features/page.tsx` itd.,
- sekcje UI landingu w `features/marketing/sections/*` **albo** `app/(marketing)/_landing/*`.

### Dlaczego tak
- Landing ma inne cele (SEO, konwersja, A/B testy) niż moduły `dashboard/clients`.
- Utrzymujesz czysty podział: produkt zalogowany vs marketing/public.
- Możesz niezależnie rozwijać copy, analitykę i performance pod SEO.

### Czego unikać
- Nie wkładaj landing page do `modules/clients` ani `modules/dashboard`.
- Nie mieszaj komponentów marketingowych z komponentami „app shell” sekcji zalogowanej.

### Minimalny praktyczny układ
- `app/(marketing)/...` – routing i strony publiczne,
- `app/(marketing)/_landing/...` – sekcje i komponenty landingu (zgodnie z obecną implementacją),
- `features/marketing/...` – opcjonalnie, jeśli później wydzielisz marketing jako osobny moduł,
- `shared/ui/...` – atomy UI współdzielone (button, card itp.).

To zachowuje Twój model izolacji micro‑SaaS i jednocześnie porządkuje warstwę marketingową.
