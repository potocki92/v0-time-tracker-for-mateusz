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
| `app/api/cron/work-automation/route.ts` | Punkt wejścia harmonogramu (Bearer `CRON_SECRET`). |
| `supabase/migrations/20260912140000_work_automation_supabase_cron.sql` | **Harmonogram**: job pg_cron `work-automation-minute-tick` (co minutę) + funkcja wyzwalacza. |
| `.github/workflows/work-automation.yml` | Ręczny fallback diagnostyczny (`workflow_dispatch`, **bez** harmonogramu). |
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

Supabase Cron — job `work-automation-minute-tick`, `* * * * *` (co minutę)
  └─ public.work_automation_cron_tick()   adres i sekret z Vault, POST przez pg_net
       └─ POST /api/cron/work-automation  Authorization: Bearer CRON_SECRET
            └─ runWorkAutomation          klient service-role, pętla po włączonych kontach
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
  nigdy nie następuje **przed** ustawioną godziną. Scheduler woła je co minutę
  (sekcja 8), więc **zdecydowana większość przebiegów nie robi nic** — i tak ma
  być: pusty przebieg to dwa zapytania po indeksach na włączone konto.
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

## 8. Harmonogram: Supabase Cron

### 8.1 Architektura i dlaczego tak

```
Supabase Cron (pg_cron, job `work-automation-minute-tick`, `* * * * *`)
  └─ public.work_automation_cron_tick()      adres + sekret z Vault
       └─ net.http_post (pg_net, w tle)      POST, Bearer CRON_SECRET
            └─ /api/cron/work-automation     runWorkAutomation → runAutomationForUser
```

**Dlaczego nie GitHub Actions.** Poprzednio harmonogram stał w
`.github/workflows/work-automation.yml` z `cron: '0 * * * *'`. Dawało to dwa
niezależne opóźnienia naraz: krok godzinowy (do ~60 minut od ustawionej godziny)
oraz kolejkę GitHub Actions, która w godzinach szczytu potrafi spóźnić
uruchomienie o kilkanaście minut albo pominąć przebieg. Dla użytkownika z
`run_time = 17:00` realny zapis mógł wypaść o 18:20 — albo o 16:25 „za
poprzednią godzinę”, a potem cisza. pg_cron chodzi wewnątrz bazy i trzyma się
minuty.

**Dlaczego co minutę, a nie o godzinie użytkownika.** `run_time` jest
własnością **każdego konta osobno** i żyje w strefie IANA tego konta — z DST.
Harmonogram „pod użytkownika” oznaczałby job na konto, przeliczanie przesunięć
strefy w SQL i przebudowę jobów po każdej zmianie ustawień. Zamiast tego jest
**jeden globalny tick** i cała decyzja zostaje w TypeScripcie (`isDue`).
Dzięki temu 17:00, 17:15, 18:42 i 23:59 w dowolnych strefach obsługuje ta sama,
jedna linijka harmonogramu.

**Dlaczego to nie tworzy duplikatów.** Tick jest wyłącznie wyzwalaczem HTTP —
nie zna żadnej reguły biznesowej. Pojedynczość pilnują dwie rzeczy w bazie:

| Mechanizm | Co gwarantuje |
|---|---|
| `work_automation_runs` — `PRIMARY KEY (user_id, local_date)` | Dzień raz rozstrzygnięty (wynik inny niż `error`) nie wraca do rozpatrzenia. Kolejne ticki tej samej doby nic nie robią. |
| `work_entries` — `UNIQUE (user_id, date, entry_kind)` | Najwyżej jeden wpis rzeczywisty na dzień, **nawet gdy dwa przebiegi wstawiają go w tej samej sekundzie**. Przegrany dostaje `23505` i zapisuje `skipped / entry_exists`, nigdy nie nadpisuje. |

`insertAutomationEntry` **nie** robi `if (!exists) insert()` — wstawia od razu
i traktuje konflikt jako pominięcie. To istotne: sprawdzenie przed zapisem
zostawiałoby okno, w które zmieściłby się drugi przebieg.

Dziennik decyzji jest dodatkowo chroniony od strony zapisu: `upsertRunRecord`
robi INSERT, a przy konflikcie UPDATE **zawężony do wiersza z `outcome = 'error'`**.
Bez tego zawężenia przegrany przebieg nadpisywał wynik zwycięzcy
(`created` → `skipped / entry_exists`) i dziennik kłamał o tym, co się stało.
Jedyne dozwolone przejście to `error` → cokolwiek, bo błąd jest ponawialny.

### 8.2 Sekrety w Supabase Vault

Tick potrzebuje dwóch wartości. **Żadna z nich nie jest w repozytorium, migracji
ani w SQL trzymanym w Git** — migracja zawiera tylko ich nazwy:

| Nazwa sekretu | Wartość |
|---|---|
| `work_automation_app_url` | Adres wdrożenia **bez** końcowego `/`, np. `https://time-tracker-mateusz.vercel.app` |
| `work_automation_cron_secret` | Ta sama wartość, co `CRON_SECRET` w zmiennych środowiskowych aplikacji |

Dodaj je **raz**, w SQL Editorze Supabase (Dashboard → SQL Editor). Komenda nie
trafia do Git, a wartość jest w bazie zaszyfrowana:

```sql
select vault.create_secret(
  'https://TWOJ-ADRES.vercel.app',   -- bez końcowego slasha
  'work_automation_app_url',
  'Work Automation: adres aplikacji dla schedulera'
);

select vault.create_secret(
  'TWOJ_CRON_SECRET',                -- dokładnie to, co CRON_SECRET w aplikacji
  'work_automation_cron_secret',
  'Work Automation: sekret endpointu crona'
);
```

Zmiana wartości później (rotacja sekretu, nowa domena):

```sql
select vault.update_secret(
  (select id from vault.secrets where name = 'work_automation_cron_secret'),
  'NOWA_WARTOSC'
);
```

Nazwy sekretów można bezpiecznie wypisać; **wartości nigdy**. `vault.secrets`
pokazuje tylko szyfrogram, a odszyfrowanie (`vault.decrypted_secrets`) jest
dostępne wyłącznie dla roli uprzywilejowanej — dlatego funkcja ticku jest
`SECURITY DEFINER` z odebranym `EXECUTE` dla `PUBLIC`. Komenda jobu w
`cron.job` zawiera samo wywołanie funkcji, więc sekret nie leży w żadnej
tabeli w postaci jawnej.

### 8.3 Wdrożenie od zera

1. **Zmienne środowiskowe aplikacji** (Vercel → Project Settings → Environment Variables):
   - `CRON_SECRET` — długi losowy ciąg,
   - `SUPABASE_SERVICE_ROLE_KEY` — klucz service-role.
2. **Sekrety Vault** — sekcja 8.2 powyżej.
3. **Migracje**
   ```bash
   supabase db push          # albo: supabase migration up
   ```
   Migracja `20260912140000_work_automation_supabase_cron.sql` włącza `pg_cron`,
   `pg_net` i `supabase_vault`, tworzy funkcję wyzwalacza i planuje job.
   Jeśli sekretów jeszcze nie ma, migracja **przejdzie** i wypisze `NOTICE` z ich
   nazwami — do czasu dodania wartości każdy tick kończy się błędem widocznym
   w `cron.job_run_details`.
4. **Sekrety repozytorium** (GitHub → Settings → Secrets and variables → Actions) —
   tylko dla ręcznego fallbacku: `APP_URL`, `CRON_SECRET`.
5. **Konfiguracja użytkownika**: Ustawienia konta → „Automatyczne zapisywanie
   pracy" → grafik, klient, godzina → *Zapisz* → przełącznik *Zapisuj automatycznie*.

### 8.4 Weryfikacja

**Czy rozszerzenia są włączone:**

```sql
select extname, extversion from pg_extension
 where extname in ('pg_cron', 'pg_net', 'supabase_vault');
```

**Czy job istnieje i jest aktywny** (powinien być dokładnie jeden wiersz):

```sql
select jobid, jobname, schedule, active, command
  from cron.job
 where jobname = 'work-automation-minute-tick';
```

**Ostatnie przebiegi schedulera** (`status = 'succeeded'` znaczy „POST został
zakolejkowany”, nie „aplikacja odpowiedziała 200”):

```sql
select d.start_time, d.status, d.return_message
  from cron.job_run_details d
  join cron.job j using (jobid)
 where j.jobname = 'work-automation-minute-tick'
 order by d.start_time desc
 limit 20;
```

**Odpowiedzi HTTP z aplikacji** — to tu widać `{processed, created, skipped,
failed}` oraz ewentualne 401:

```sql
select created, status_code, content
  from net._http_response
 order by created desc
 limit 20;
```

**Ręczne wywołanie ticku** (pomija harmonogram, reszta drogi identyczna):

```sql
select public.work_automation_cron_tick();
```

**Ręczne wywołanie endpointu z terminala** — sekret podaj ze zmiennej
środowiskowej, nie wklejaj go do historii powłoki:

```bash
curl -i -X POST "$APP_URL/api/cron/work-automation" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H 'Content-Type: application/json' \
  --data '{}'
```

**Czy GitHub Actions nie odpala się już samo:**
- `.github/workflows/work-automation.yml` nie ma klucza `schedule:` —
  `grep -n 'schedule' .github/workflows/work-automation.yml` nie zwraca nic;
- GitHub → Actions → *Work Automation (manual fallback)* — widoczny jest tylko
  przycisk *Run workflow*, a lista biegów przestaje rosnąć sama.

### 8.5 Rzeczywista częstotliwość i opóźnienie

Scheduler sprawdza automat **co minutę**, więc zapis wypada przy pierwszym ticku
po ustawionej godzinie — zwykle w granicach minuty. Nigdy **przed** nią.
Interfejs mówi o tym wprost i **nie obiecuje** dokładności co do sekundy: tick
może się opóźnić (restart bazy, chwilowa niedostępność aplikacji), a wtedy zapis
po prostu wykona się przy kolejnym.

**Koszt po stronie bazy.** Pusty przebieg to dwa zapytania po indeksach na
**włączone** konto (`fetchSettings` + `fetchRunRecords`); ciężka czwórka zapytań
(wyjazdy, wznowienia, wpisy, wersje reguł) odpala się tylko wtedy, gdy jakaś data
jest naprawdę nierozstrzygnięta. Konta z wyłączonym automatem nie są w ogóle
czytane — listę bierze zapytanie po indeksie częściowym
`idx_work_automation_settings_enabled`.

**Co rośnie.** Tick co minutę dopisuje ~1440 wierszy na dobę do
`cron.job_run_details` (pg_cron nie czyści go sam; odpowiedzi w
`net._http_response` pg_net kasuje po kilku godzinach). Zalecane sprzątanie —
jednorazowo, raz na dobę:

```sql
select cron.schedule(
  'cron-job-run-details-cleanup',
  '17 3 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '7 days';$$
);
```

Zmiana częstotliwości nie wymaga tknięcia logiki — wystarczy przeplanować job:

```sql
select cron.alter_job(
  (select jobid from cron.job where jobname = 'work-automation-minute-tick'),
  schedule := '*/5 * * * *'
);
```

### 8.6 Rollback

**Sam scheduler** (automat przestaje cokolwiek zapisywać, dane zostają):

```sql
select cron.unschedule('work-automation-minute-tick');
```

Włączenie z powrotem:

```sql
select cron.schedule(
  'work-automation-minute-tick',
  '* * * * *',
  $$select public.work_automation_cron_tick();$$
);
```

**Pełne wycofanie migracji** (gdy trzeba usunąć też funkcję):

```sql
select cron.unschedule('work-automation-minute-tick');
drop function if exists public.work_automation_cron_tick();
-- Sekrety w Vault mogą zostać; jeśli mają zniknąć:
-- delete from vault.secrets
--  where name in ('work_automation_app_url', 'work_automation_cron_secret');
```

Rozszerzeń `pg_cron` / `pg_net` **nie wyłączamy** — korzystać z nich mogą inne
joby.

**Powrót do GitHub Actions** (domyślnie tego nie robimy — to był właśnie
problem): w `.github/workflows/work-automation.yml` dodać z powrotem

```yaml
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:
```

i **najpierw** wyłączyć job pg_cron, żeby dwa schedulery nie wołały tego samego
endpointu równolegle. Duplikatów by to nie wywołało (pilnują tego klucze w
bazie), ale podwajałoby zapytania bez żadnego zysku.

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
2. **Czy minęła godzina zapisu i czy scheduler w ogóle chodzi?**
   Zapytania z sekcji 8.4 — po kolei: czy job istnieje i jest `active`, co mówią
   ostatnie wiersze `cron.job_run_details`, co wróciło w `net._http_response`.
   Typowe wyniki:
   - brak wiersza w `cron.job` → migracja nie weszła,
   - `status = 'failed'` z komunikatem o sekrecie Vault → brak wartości
     z sekcji 8.2,
   - `net._http_response` ze `status_code = 401` → `work_automation_cron_secret`
     w Vault różni się od `CRON_SECRET` w aplikacji,
   - brak wiersza w `net._http_response` przy `succeeded` w `job_run_details` →
     aplikacja nie odpowiedziała w limicie (błędny adres w
     `work_automation_app_url`, wdrożenie nie odpowiada).
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
| Zachowanie przy ticku co minutę, strefy, DST, dwa przebiegi naraz | `services/workAutomation.runner.server.ts`, `services/workAutomation.repository.server.ts` | `__test__/work-automation/scheduler.test.ts` |
| Autoryzacja endpointu harmonogramu | `app/api/cron/work-automation/route.ts` | `__test__/work-automation/cron-endpoint.test.ts` |
| Harmonogram (częstotliwość, wyzwalacz, sekrety) | `supabase/migrations/20260912140000_work_automation_supabase_cron.sql` | weryfikacja ręczna — sekcja 8.4 |
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
