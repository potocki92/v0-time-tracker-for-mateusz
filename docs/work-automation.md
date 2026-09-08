# Automatyczne zapisywanie pracy

Automat samodzielnie dopisuje do kalendarza **rzeczywiście przepracowane dni**.
Nie jest generatorem planu ani funkcją wymagającą codziennego zatwierdzania:
raz skonfigurowany, o ustalonej godzinie zapisuje ustaloną liczbę godzin za dany
dzień. Działa po stronie serwera — przy zamkniętej aplikacji, wyłączonym
telefonie i bez otwartej karty przeglądarki.

---

## 1. Słownik pojęć

| Pojęcie | Znaczenie |
|---|---|
| **Godzina zapisu** (`run_time`) | Moment **dopisania** ustalonej liczby godzin za dany dzień. To nie jest godzina rozpoczęcia pracy ani wskazanie, żeby mierzyć czas stoperem. |
| **Data uruchomienia** (`start_date`) | Pierwszy dzień, który automat może w ogóle rozpatrzyć. |
| **Grafik tygodnia** (`week_schedule`) | Dla każdego dnia: czy jest pracujący i ile godzin. |
| **Wyjazd** (`trips`) | Okres pracy poza domem. `start_date` to pierwszy dzień pracy, `end_date` — ostatni dzień pracy i dzień powrotu po pracy. Obie granice **włącznie**. |
| **Pobyt w domu** | Okres od dnia po powrocie do dnia poprzedzającego kolejny wyjazd. Automat nie dopisuje wtedy godzin. |
| **Wznowienie** (`work_automation_resumptions`) | Jawna decyzja użytkownika „pracuję od dnia X", działająca także bez znanej daty kolejnego zjazdu. |
| **Wersja konfiguracji** (`work_automation_setting_versions`) | Snapshot ustawień obowiązujący od danej chwili. Nadrabianie zaległości czyta wersję właściwą dla danej daty, nie dzisiejszą. |
| **Dziennik decyzji** (`work_automation_runs`) | Jeden wiersz na (użytkownik, data lokalna): co się stało i dlaczego. Zarazem znacznik „dzień rozstrzygnięty". |

---

## 2. Reguły biznesowe z przykładami

### 2.1 Kolejność reguł przy tworzeniu wpisu

Kolejność jest częścią kontraktu — zmiana kolejności zmienia zachowanie.

1. **Automat wyłączony, data przed aktywacją albo termin jeszcze nie nadszedł** → brak zapisu.
2. **Pobyt w domu albo wyłączony dzień tygodnia** → brak zapisu.
3. **Istniejący wpis rzeczywisty (`entry_kind = 'real'`)** → brak nadpisania, niezależnie od tego, kto go utworzył.
4. **Ręcznie wpisany urlop, choroba, dzień wolny, „nieprzepracowany"** → to też wpisy rzeczywiste, więc obejmuje je punkt 3.
5. **Dzień już rozstrzygnięty w dzienniku** (również: wpis automatyczny usunięty ręcznie) → nie odtwarzamy go.
6. Dopiero po przejściu tych warunków powstaje brakujący wpis rzeczywisty.

Wpis **planowany** (`entry_kind = 'predicted'`) nie jest dowodem wykonania pracy
i nie ma pierwszeństwa przed ustawieniami automatu. Jeżeli dla daty istnieje
tylko plan, plan zostaje, a automat tworzy obok wpis rzeczywisty.

### 2.2 Zjazdy i powroty do domu

Automat używa istniejących wyjazdów (`public.trips`) — nie ma drugiego,
niezależnego kalendarza zjazdów.

Zdarzenia rozstrzygamy **chronologicznie**, nie w kolejności rekordów:

1. Wyjazdy nakładające się i **przylegające** (koniec + 1 dzień = początek
   następnego) są najpierw scalane w rozłączne okresy. Bez tego kroku wyjazdy
   1–12 i 5–20 września dałyby fałszywą przerwę 13–20 września w środku
   trwającego wyjazdu.
2. Data wewnątrz scalonego okresu → **praca** (dzień nadal podlega grafikowi
   tygodnia).
3. Poza okresem decyduje ostatnie zdarzenie o dacie ≤ rozpatrywana data:
   powrót (koniec wyjazdu) otwiera pobyt w domu **od następnego dnia**,
   wznowienie otwiera okres pracy od wskazanego dnia.
4. Gdy ostatni powrót jest **późniejszy lub równy** dacie uruchomienia → pobyt
   w domu („wróciłem i nie wiadomo, kiedy jadę znowu").
5. Gdy ostatni powrót jest **wcześniejszy** niż data uruchomienia (wyjazd
   archiwalny) → o wyniku decyduje istnienie przyszłego wyjazdu: jeśli jest,
   czekamy w domu na jego początek; jeśli nie ma — pracujemy według grafiku.
   Dzięki temu stare zjazdy nie blokują automatu na zawsze.
6. Brak jakichkolwiek wyjazdów → praca według grafiku, bez dodatkowych przerw.
   **Nie ma** cyklu 4/1, obowiązkowych dni odpoczynku ani przerw wyliczanych
   z długości pracy. Brak zjazdów **nie włącza** automatycznie niedziel —
   włączone dni tygodnia zawsze obowiązują.

**Przykład.** Wyjazd 1–12 września, następny 21–30 września, grafik pon–sob:

| Data | Wynik |
|---|---|
| 1 IX (wt) | zapis 10 h — pierwszy dzień wyjazdu jest dniem pracy |
| 6 IX (nd) | brak — niedziela wyłączona w grafiku |
| 12 IX (sb) | zapis 8 h — dzień powrotu jest jeszcze dniem pracy |
| 13–20 IX | brak — pobyt w domu |
| 21 IX | zapis — kolejny wyjazd |

**Pusta lista wyjazdów to nie to samo, co błąd ich odczytu.** Awaria zapytania
kończy się wynikiem `error / trips_unavailable` i brakiem zapisu — nigdy
odczytem „brak zjazdów, więc pracuję". Z tego samego powodu automat **nie
korzysta** z wyniku `no_trips` licznika powrotów (`computeTripCountdown`):
oznacza on również zakończenie ostatniego wyjazdu.

### 2.3 Zmiany zjazdów

Zmiana wyjazdów wpływa na **przyszłe** decyzje automatu. Nie usuwa ani nie
przelicza dni już zapisanych — te są faktem, nie prognozą.

---

## 3. Mapa plików

| Plik | Rola |
|---|---|
| `features/work-automation/domain/workAutomation.types.ts` | Typy i słownik pojęć. |
| `features/work-automation/domain/workAutomation.constants.ts` | Wartości domyślne, limity, etykiety przyczyn. |
| `features/work-automation/domain/workAutomation.schema.ts` | Walidacja konfiguracji (Zod), wspólna dla formularza i Server Action. |
| `features/work-automation/domain/workAutomation.presence.ts` | Scalanie wyjazdów i reguła praca / pobyt w domu. |
| `features/work-automation/domain/workAutomation.decide.ts` | **Główna funkcja decyzyjna** `decideDay`, podgląd `planDays`, wymagalność `isDue`, `nextRunInstant`. |
| `features/work-automation/services/workAutomation.repository.server.ts` | Cały dostęp do bazy. |
| `features/work-automation/services/workAutomation.runner.server.ts` | Wykonanie zadania: dobór dat, wersji reguł, zapis i dziennik. |
| `features/work-automation/services/workAutomation.overview.server.ts` | Dane sekcji ustawień (podgląd, stan, historia). |
| `features/work-automation/actions.ts` | Server Actions: odczyt, zapis konfiguracji, wznowienie pracy. |
| `features/work-automation/components/*` | Sekcja ustawień: stan, grafik, formularz. |
| `app/api/cron/work-automation/route.ts` | Punkt wejścia harmonogramu. |
| `.github/workflows/work-automation.yml` | Harmonogram (co godzinę). |
| `lib/date/timezone.ts` | Strefy IANA: data i godzina lokalna, czas ścienny → chwila UTC. |
| `supabase/migrations/20260908093000_work_automation.sql` | Migracja: tabele, RLS, triggery, kolumna `work_entries.source`. |

Funkcja decyzyjna przyjmuje **jawne dane i kontrolowany czas**: nie czyta bazy
ani zegara w środku. Dzięki temu podgląd w ustawieniach i zadanie serwerowe
liczą dokładnie to samo.

---

## 4. Przepływ: od ustawień do zapisu

```
Ustawienia (SettingsDrawer → WorkAutomationSection)
  └─ updateWorkAutomationSettingsAction   walidacja Zod + sprawdzenie klienta/projektu
       └─ work_automation_settings        (trigger → work_automation_setting_versions)

GitHub Actions (co godzinę)
  └─ POST /api/cron/work-automation       Authorization: Bearer CRON_SECRET
       └─ runWorkAutomation               klient service-role, pętla po włączonych kontach
            └─ runAutomationForUser
                 1. świeży odczyt konfiguracji (wyłączenie w międzyczasie = koniec)
                 2. data i godzina lokalna użytkownika (strefa IANA)
                 3. daty wymagalne: od start_date, maks. MAX_CATCHUP_DAYS wstecz
                 4. odjęcie dat już rozstrzygniętych w dzienniku
                 5. dla każdej daty: wersja reguł → decideDay → insert → dziennik
```

---

## 5. Model danych

### `work_entries` (rozszerzenie)
- `source TEXT NOT NULL DEFAULT 'manual'` (`manual` | `automation`) — kalendarz
  pokazuje po tym dyskretne „Automatycznie". Ręczna edycja wpisu **nie zmienia**
  tego pola: mówi ono, kto wpis **utworzył**.
- Istniejące `UNIQUE (user_id, date, entry_kind)` jest gwarancją „najwyżej jeden
  realny wpis na dzień".

### `work_automation_settings`
Jedna, edytowalna konfiguracja na użytkownika: `enabled`, `start_date`,
`run_time` (`HH:mm`), `time_zone` (IANA), `week_schedule` (JSONB),
`client_id`, `project_id`, `disabled_reason`.

Ograniczenia w bazie: format godziny, komplet siedmiu dni w grafiku, włączony
automat wymaga klienta.

### `work_automation_setting_versions`
Append-only snapshot konfiguracji, zapisywany triggerem przy każdej **zmianie
treści** (sam ponowny zapis bez zmian nie dokłada wersji). Bez tej historii
nadrabianie zaległości stosowałoby dzisiejsze reguły do dni sprzed zmiany.
Snapshot celowo **nie ma kluczy obcych** do klientów i projektów — usunięcie
klienta nie może przepisać historii.

### `work_automation_resumptions`
`UNIQUE (user_id, resume_date)`. Jawne wznowienia pracy.

### `work_automation_runs`
`PRIMARY KEY (user_id, local_date)` — jeden wiersz na dzień. Daje dwie rzeczy
naraz: ponowione wykonanie nie mnoży identycznych rekordów historii, a raz
rozstrzygnięta data nie wraca do rozpatrzenia. Kolumny: `outcome`
(`created` | `skipped` | `error`), `reason`, `hours`, `entry_id`,
`config_version_id`, `decided_at`.

### Uprawnienia (RLS)
- `work_automation_settings`, `..._resumptions` — odczyt i zapis własnych wierszy.
- `..._setting_versions` — odczyt własnych; INSERT idzie z triggera z prawami
  zapisującego użytkownika.
- `..._runs` — **tylko odczyt** własnych. Dziennik zapisuje wyłącznie cron
  kluczem service-role, więc użytkownik nie sfałszuje decyzji ani nie
  „odblokuje" rozstrzygniętego dnia.

Sekrety (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) zostają wyłącznie po
stronie serwera.

### Utrata klienta lub projektu
Trigger `BEFORE DELETE` na `clients` i `projects` wyłącza automat i zapisuje
`disabled_reason`. Musi być `BEFORE`, bo po `ON DELETE SET NULL` nie dałoby się
odróżnić „usunięto projekt" od „projekt nie był ustawiony". Efekt: widoczny
komunikat w ustawieniach, nigdy zapis pod innym klientem.

---

## 6. Strefy czasowe

Dzień i godzina liczą się w strefie **użytkownika**, nie serwera
(`lib/date/timezone.ts`, baza IANA przez `Intl`). Nie ma nigdzie sztywnego
dodawania jednej czy dwóch godzin do UTC.

- **Wiosna, godzina która nie istnieje** (np. 02:30 przy skoku 02:00 → 03:00):
  wymagalność sprawdzamy porównaniem `lokalne minuty >= ustawione minuty`, więc
  zapis wykonuje się przy pierwszej dostępnej chwili po przeskoku.
- **Jesień, godzina powtórzona**: dziennik ma klucz na (użytkownik, data
  lokalna), więc zapis następuje **raz**.
- **Przebieg kilka minut po północy**: data bierze się z lokalnego kalendarza
  użytkownika, więc godziny trafiają do właściwego dnia, a nie do
  poprzedniego/następnego.

---

## 7. Ponowienia, zaległości i awarie

- Zadanie **nie musi trafić w konkretną minutę**: samo wybiera daty, dla których
  termin został osiągnięty lub przekroczony, a decyzji jeszcze nie ma. Zapis
  nigdy nie następuje **przed** ustawioną godziną.
- Włączenie funkcji dziś po godzinie zapisu pozwala wykonać dzisiejszy zapis
  przy najbliższym przebiegu (dla dzisiejszej daty obowiązuje bieżąca wersja
  reguł — koniec dzisiejszej doby jest jeszcze w przyszłości).
- Nadrabianie obejmuje **wyłącznie okres aktywności**: dla każdej daty bierzemy
  wersję konfiguracji obowiązującą na koniec jej lokalnej doby (nie później niż
  teraz). Wyłączenie i ponowne włączenie **nie uzupełni** okresu świadomego
  wyłączenia (`skipped / automation_disabled`).
- Dni, dla których **nie znamy** poprzednich ustawień (np. `start_date`
  ustawiona wstecz przed pierwszym zapisem konfiguracji), dostają
  `skipped / unknown_settings` i trafiają do użytkownika do rozstrzygnięcia —
  dzisiejsze ustawienia nie działają wstecz.
- Jeden przebieg przetwarza najwyżej `MAX_CATCHUP_DAYS` (14) dni; reszta idzie
  do kolejnych przebiegów.
- **Błąd ponawialny** (`outcome = 'error'`) nie zamyka daty — kolejny przebieg
  spróbuje ponownie. **Świadome pominięcie** (`skipped`) zamyka ją na stałe.
- Błąd jednego użytkownika nie zatrzymuje obsługi pozostałych.

### Przyczyny w dzienniku

| `reason` | Znaczenie |
|---|---|
| `created` | Wpis utworzony. |
| `before_start` | Data przed uruchomieniem automatu. |
| `home_stay` | Pobyt w domu. |
| `weekday_off` | Dzień tygodnia wyłączony w grafiku (albo 0 godzin). |
| `entry_exists` | Wpis rzeczywisty już istniał (ręczny albo z równoległego przebiegu). |
| `automation_disabled` | W tym dniu automat był wyłączony. |
| `unknown_settings` | Brak historii ustawień dla tej daty. |
| `trips_unavailable` | Błąd odczytu wyjazdów — **ponawialny**. |
| `client_missing` / `client_not_hourly` / `project_mismatch` | Konfiguracja wskazuje niedostępne albo niewłaściwe dane — **ponawialne**. |
| `insert_failed` | Zapis nie powiódł się — **ponawialny**. |

---

## 8. Harmonogram: konfiguracja i uruchomienie

Wybraliśmy ten sam mechanizm, którym działa cotygodniowy skrót
(`.github/workflows/weekly-summary.yml`): GitHub Actions woła endpoint aplikacji.
Vercel Hobby daje tylko jedno uruchomienie crona na dobę, a Supabase Free nie ma
`pg_cron` — GitHub Actions jest tu jedyną opcją zgodną z obecną infrastrukturą.

1. **Migracja bazy**
   ```bash
   supabase db push        # albo: supabase migration up
   ```
2. **Zmienne środowiskowe aplikacji** (Vercel → Project Settings → Environment Variables):
   - `CRON_SECRET` — dowolny długi losowy ciąg,
   - `SUPABASE_SERVICE_ROLE_KEY` — klucz service-role (już używany przez skrót tygodnia).
3. **Sekrety repozytorium** (GitHub → Settings → Secrets and variables → Actions):
   - `APP_URL` — adres wdrożenia, np. `https://time-tracker-mateusz.vercel.app`,
   - `CRON_SECRET` — **ta sama** wartość, co w aplikacji.
4. **Włączenie harmonogramu**: workflow `Work Automation` uruchamia się sam po
   wejściu na `main`. Ręczny test: GitHub → Actions → *Work Automation* → *Run workflow*.
   Odpowiedź to `Processed / Created / Skipped / Failed`.
5. **Konfiguracja użytkownika**: Ustawienia konta → „Automatyczne zapisywanie
   pracy" → grafik, klient, godzina → *Zapisz* → przełącznik *Zapisuj automatycznie*.

### Rzeczywista częstotliwość i opóźnienie

Sprawdzanie odbywa się **co godzinę**, o pełnej godzinie UTC. Realne opóźnienie
względem ustawionej godziny to więc do ~60 minut, plus opóźnienie samego GitHub
Actions (harmonogramy w godzinach szczytu potrafią spóźnić się o kilkanaście
minut). Interfejs mówi o tym wprost i **nie obiecuje** dokładności co do minuty.
Chcąc zawęzić okno, wystarczy zmienić `cron` w workflow na `'*/30 * * * *'` —
logika zadania nie wymaga żadnej zmiany, bo sama wybiera daty wymagalne.

### Odświeżanie otwartych widoków

Zadanie pisze po stronie serwera, więc otwarta karta zobaczy nowy dzień przy
najbliższym pobraniu danych przez TanStack Query (`staleTime` 5 min,
`refetchOnWindowFocus` dla kalendarza) — tak samo, jak każdą inną zmianę danych
w aplikacji. Zapis konfiguracji automatu unieważnia dodatkowo klucze `calendar`
i `dashboard`.

---

## 9. Diagnostyka: „dlaczego nie ma wpisu?"

Idź po kolei — pierwsza odpowiedź „nie" kończy poszukiwania:

1. **Czy automat jest włączony i czy data ≥ `start_date`?**
   Ustawienia → nagłówek sekcji i pole *Data rozpoczęcia*.
2. **Czy minęła godzina zapisu i czy przebieg się odbył?**
   GitHub → Actions → *Work Automation* → ostatni bieg. Brak biegów oznacza brak
   sekretów `APP_URL` / `CRON_SECRET` albo wyłączony workflow.
3. **Co mówi dziennik decyzji?**
   Ustawienia → *Ostatnie wykonania*, albo bezpośrednio:
   ```sql
   SELECT local_date, outcome, reason, hours, entry_id
   FROM public.work_automation_runs
   WHERE user_id = '<uuid>'
   ORDER BY local_date DESC
   LIMIT 20;
   ```
   Tabela przyczyn jest w sekcji 7.
4. **Czy dzień nie jest już rozstrzygnięty?** Wiersz z `outcome` innym niż
   `error` zamyka datę na stałe — również wtedy, gdy wpis został potem usunięty
   ręcznie. To zachowanie celowe.
5. **Czy dzień nie wypada w pobycie w domu?** Ustawienia → *Stan* i *Najbliższe
   7 dni*. Podgląd liczy tę samą logikę, co zadanie.
6. **Czy klient nadal istnieje i jest rozliczany godzinowo?** `client_missing` /
   `client_not_hourly` w dzienniku, a w ustawieniach czerwony komunikat, gdy
   automat wyłączył się po usunięciu klienta lub projektu.

---

## 10. Gdzie zmienić regułę i co ją zabezpiecza

| Reguła | Miejsce zmiany | Test |
|---|---|---|
| Wartości początkowe grafiku, godzina, strefa | `domain/workAutomation.constants.ts` | `__test__/work-automation/settings-schema.test.ts` |
| Walidacja konfiguracji (0 < godziny ≤ 24, klient wymagany) | `domain/workAutomation.schema.ts` | `__test__/work-automation/settings-schema.test.ts` |
| Scalanie wyjazdów, praca vs pobyt w domu, wznowienia | `domain/workAutomation.presence.ts` | `__test__/work-automation/presence.test.ts` |
| Kolejność reguł tworzenia wpisu | `domain/workAutomation.decide.ts` (`decideDay`) | `__test__/work-automation/decide.test.ts` |
| Wymagalność terminu, najbliższy zapis | `domain/workAutomation.decide.ts` (`isDue`, `nextRunInstant`) | `__test__/work-automation/decide.test.ts` |
| Strefy IANA, zmiana czasu | `lib/date/timezone.ts` | `__test__/work-automation/timezone.test.ts` |
| Dobór wersji reguł, limit nadrabiania, dziennik | `services/workAutomation.runner.server.ts` | `__test__/work-automation/runner.test.ts` |
| Uprawnienia, współbieżność, trigger wyłączenia | `supabase/migrations/20260908093000_work_automation.sql` | `__test__/rls.test.ts` (suite `test:rls`, wymaga lokalnego Supabase) |
| Rozdział planu i wykonania w raportach i fakturach | `lib/finance/realization.ts`, `features/reports/lib/analytics.ts`, `features/invoices/services/server/*` | `__test__/work-automation/billing-integration.test.ts` |

---

## 11. Integracja z raportami i fakturowaniem

Automat tworzy wpis `real` także dla dni, dla których istnieje już ręczny plan
`predicted`. Wcześniej raporty i fakturowanie liczyły każdy wpis o statusie
`worked`, więc taka data zostałaby naliczona **dwa razy**. Zawężono więc do
wpisów rzeczywistych:

- `features/reports/lib/analytics.ts` — podsumowanie i eksport dni z zakresu,
- `features/invoices/services/server/invoices.service.server.ts` — auto-fakturowanie,
- `features/invoices/services/server/worked-weeks.service.server.ts`,
- `features/invoices/services/server/worked-quarters.service.server.ts`.

Pulpit i skrót tygodnia korzystały już z `partitionByRealization`, więc nie
wymagały zmian. Brak `entry_kind` w starych wierszach nadal znaczy `real`.
