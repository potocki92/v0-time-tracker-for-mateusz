-- Scheduler automatu pracy: Supabase Cron zamiast GitHub Actions.
--
-- DLACZEGO: GitHub Actions nie gwarantuje uruchomienia o wskazanej godzinie —
-- harmonogram „0 * * * *" w godzinach szczytu potrafi wystartowac kilkanascie
-- minut pozniej albo nie wystartowac wcale. Przy kroku godzinowym okno bledu
-- wzgledem ustawionej przez uzytkownika godziny zapisu siegalo ~60 minut.
-- pg_cron chodzi wewnatrz bazy i trzyma sie minuty.
--
-- DLACZEGO CO MINUTE, a nie o godzinie uzytkownika: godzina zapisu (`run_time`)
-- jest wlasnoscia KAZDEGO konta osobno i zyje w strefie IANA tego konta (DST!).
-- Harmonogram per uzytkownik oznaczalby job na konto, przeliczanie przesuniec
-- w SQL i osobny job po kazdej zmianie ustawien. Zamiast tego jest JEDEN
-- globalny tick, a o wymagalnosci decyduje aplikacja (`isDue` w TypeScript).
-- Dzieki temu 17:00, 17:15, 18:42 i 23:59 w dowolnych strefach obsluguje ta
-- sama, jedna linijka harmonogramu.
--
-- DLACZEGO TO NIE TWORZY DUPLIKATOW: tick jest wylacznie wyzwalaczem HTTP.
-- Decyzje podejmuje `runAutomationForUser`, a pojedynczosc pilnuja dwie rzeczy
-- w bazie: PRIMARY KEY (user_id, local_date) na `work_automation_runs`
-- (dzien raz rozstrzygniety nie wraca do rozpatrzenia) oraz
-- UNIQUE (user_id, date, entry_kind) na `work_entries` (najwyzej jeden wpis
-- rzeczywisty na dzien, nawet przy dwoch przebiegach w tej samej sekundzie).
--
-- ZADNEJ LOGIKI BIZNESOWEJ W SQL. Zrodlem prawdy pozostaje
-- `features/work-automation/`. Ten plik umie tylko wyslac POST.
--
-- Pelna instrukcja wdrozenia, weryfikacji i rollbacku: docs/work-automation.md §8.

-- ── Rozszerzenia ─────────────────────────────────────────────────────────────
-- `pg_cron` zaklada wlasny schemat `cron`, `pg_net` — `net`, wiec funkcje
-- wolamy z kwalifikacja schematu i nie zgadujemy miejsca instalacji.
-- Instalacja wymaga uprawnien superusera; na Supabase ma je rola `postgres`,
-- ktora wykonuje migracje. Na bazie bez tych rozszerzen migracja ma sie
-- przerwac CZYTELNYM komunikatem, nie bledem o braku funkcji 300 linii dalej.

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION
    'Nie udalo sie wlaczyc rozszerzenia pg_cron (%). Wlacz je w Supabase Studio: Database → Extensions → pg_cron, i uruchom migracje ponownie.',
    SQLERRM;
END $$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION
    'Nie udalo sie wlaczyc rozszerzenia pg_net (%). Wlacz je w Supabase Studio: Database → Extensions → pg_net, i uruchom migracje ponownie.',
    SQLERRM;
END $$;

-- Vault trzyma adres aplikacji i sekret crona. Na projektach Supabase jest
-- wlaczony domyslnie; `IF NOT EXISTS` obsluguje te, ktore go nie maja.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION
    'Nie udalo sie wlaczyc rozszerzenia supabase_vault (%). Wlacz je w Supabase Studio: Database → Extensions → supabase_vault.',
    SQLERRM;
END $$;

-- ── Wyzwalacz ────────────────────────────────────────────────────────────────
-- Funkcja, a nie SQL wklejony w harmonogram, z dwoch powodow:
--   1. `cron.job.command` jest zwyklym tekstem w tabeli — wartosc sekretu nie
--      ma prawa tam trafic. W komendzie stoi samo wywolanie funkcji, a sekret
--      jest czytany z Vault dopiero w czasie wykonania.
--   2. zmiana adresu, naglowkow czy timeoutu nie wymaga dotykania harmonogramu.
--
-- SECURITY DEFINER jest konieczne: `vault.decrypted_secrets` odszyfrowuje
-- sekrety tylko dla uprzywilejowanej roli. Dlatego zaraz pod definicja
-- odbieramy prawo wykonania wszystkim poza wlascicielem — inaczej kazda sesja
-- (takze `anon`) mogla by kazac bazie wyslac POST z sekretem w naglowku.

CREATE OR REPLACE FUNCTION public.work_automation_cron_tick()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  app_url     TEXT;
  cron_secret TEXT;
  request_id  BIGINT;
BEGIN
  SELECT decrypted_secret INTO app_url
    FROM vault.decrypted_secrets
   WHERE name = 'work_automation_app_url';

  SELECT decrypted_secret INTO cron_secret
    FROM vault.decrypted_secrets
   WHERE name = 'work_automation_cron_secret';

  -- Komunikat nazywa BRAKUJACY SEKRET, nigdy jego wartosc. Wyjatek zamiast
  -- cichego wyjscia: nieudany tick ma byc widoczny w `cron.job_run_details`.
  IF app_url IS NULL OR btrim(app_url) = '' THEN
    RAISE EXCEPTION 'work_automation_cron_tick: brak sekretu Vault "work_automation_app_url"';
  END IF;

  IF cron_secret IS NULL OR btrim(cron_secret) = '' THEN
    RAISE EXCEPTION 'work_automation_cron_tick: brak sekretu Vault "work_automation_cron_secret"';
  END IF;

  -- `net.http_post` tylko KOLEJKUJE zadanie — wlasciwy HTTP wykonuje w tle
  -- worker pg_net, wiec tick konczy sie w milisekundach i nie blokuje bazy.
  -- Odpowiedzi laduja w `net._http_response` (patrz docs §8, weryfikacja).
  --
  -- Timeout z zapasem: przebieg chodzi w petli po kontach i jest wolniejszy niz
  -- domyslne 5 s. Urwanie polaczenia w trakcie zapisu nie zdublowaloby wpisow
  -- (pilnuja tego klucze w bazie), ale zostawialoby dzien nierozstrzygniety.
  SELECT net.http_post(
    url := rtrim(btrim(app_url), '/') || '/api/cron/work-automation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || btrim(cron_secret)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) INTO request_id;

  RETURN request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.work_automation_cron_tick() FROM PUBLIC;

COMMENT ON FUNCTION public.work_automation_cron_tick() IS
  'Wyzwalacz HTTP automatu pracy dla pg_cron. Czyta adres i sekret z Vault; zero logiki biznesowej.';

-- ── Harmonogram ──────────────────────────────────────────────────────────────
-- `cron.schedule` z nazwa jest idempotentne (pg_cron >= 1.4 aktualizuje job
-- o tej samej nazwie zamiast dokladac drugi), wiec ponowne uruchomienie
-- migracji nie rozmnozy schedulerow. Na starszych wersjach unikalny indeks
-- (username, jobname) zglosi blad — tez nie duplikat.

SELECT cron.schedule(
  'work-automation-minute-tick',
  '* * * * *',
  $cron$SELECT public.work_automation_cron_tick();$cron$
);

-- Brak sekretow nie jest bledem migracji: job moze istniec wczesniej niz
-- wartosci. Do czasu ich dodania kazdy tick konczy sie wyjatkiem widocznym
-- w `cron.job_run_details` — i o tym trzeba powiedziec wprost.
DO $$
DECLARE
  missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Rzutowanie na `text` jest konieczne: bez niego Postgres rozstrzyga literal
  -- nieznanego typu jako `text[]` i przewraca sie na „malformed array literal".
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'work_automation_app_url') THEN
    missing := missing || 'work_automation_app_url'::text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'work_automation_cron_secret') THEN
    missing := missing || 'work_automation_cron_secret'::text;
  END IF;

  IF array_length(missing, 1) > 0 THEN
    RAISE NOTICE
      'Scheduler „work-automation-minute-tick" utworzony, ale brakuje sekretow Vault: %. Dodaj je (docs/work-automation.md §8.2) — do tego czasu kazdy przebieg konczy sie bledem.',
      array_to_string(missing, ', ');
  END IF;
END $$;
