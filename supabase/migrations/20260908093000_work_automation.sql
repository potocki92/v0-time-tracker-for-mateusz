-- Automatyczne zapisywanie przepracowanych dni.
--
-- Cztery tabele, kazda z innym zadaniem:
--   work_automation_settings          — jedna, edytowalna konfiguracja na uzytkownika,
--   work_automation_setting_versions  — append-only historia tej konfiguracji; bez niej
--                                       nadrabianie zaleglosci stosowaloby DZISIEJSZE
--                                       reguly do dni sprzed zmiany albo sprzed wlaczenia,
--   work_automation_resumptions       — jawne „wznow prace od dnia…", rozstrzygane
--                                       chronologicznie razem z powrotami z wyjazdow,
--   work_automation_runs              — jeden wiersz na (uzytkownik, data lokalna):
--                                       dziennik decyzji ORAZ znacznik „dzien juz
--                                       rozstrzygniety", dzieki ktoremu ponowne
--                                       uruchomienie nie odtwarza recznie usunietego wpisu.
--
-- Zapisy robi cron kluczem service-role (RLS omija, filtruje po `user_id` sam).
-- Uzytkownik ze swojej sesji zarzadza wylacznie wlasna konfiguracja i wznowieniami.

-- ── Zrodlo wpisu ─────────────────────────────────────────────────────────────
-- Kalendarz pokazuje po tym dyskretne „Automatycznie". Reczna edycja wpisu
-- celowo NIE zmienia `source` — pole mowi, kto wpis UTWORZYL.
ALTER TABLE public.work_entries
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.work_entries
  DROP CONSTRAINT IF EXISTS work_entries_source_valid;
ALTER TABLE public.work_entries
  ADD CONSTRAINT work_entries_source_valid CHECK (source IN ('manual', 'automation'));

-- ── Konfiguracja ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_automation_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  -- Dzien, od ktorego automat w ogole moze cokolwiek zapisac.
  start_date DATE NOT NULL,
  -- Moment DOPISANIA ustalonej liczby godzin za dany dzien — nie godzina
  -- rozpoczecia pracy i nie stoper.
  run_time TEXT NOT NULL DEFAULT '19:00',
  -- Strefa IANA. Sztywne "+1h do UTC" rozjezdza sie dwa razy w roku.
  time_zone TEXT NOT NULL DEFAULT 'Europe/Warsaw',
  -- { "mon": { "enabled": true, "hours": 10 }, ... , "sun": { ... } }
  week_schedule JSONB NOT NULL,
  -- ON DELETE SET NULL: usuniecie klienta ma zatrzymac automat z widocznym
  -- bledem, nigdy przepisac wpisow pod innego klienta.
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  -- Powod wylaczenia przez system (usuniety klient/projekt); NULL = wylaczyl
  -- uzytkownik albo automat dziala.
  disabled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT work_automation_run_time_format CHECK (run_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT work_automation_time_zone_format CHECK (time_zone ~ '^[A-Za-z][A-Za-z0-9+_-]*(/[A-Za-z0-9+._-]+)*$'),
  -- Pelny ksztalt grafiku waliduje Zod na serwerze; baza pilnuje, ze zaden
  -- dzien tygodnia nie zniknal z dokumentu.
  CONSTRAINT work_automation_week_schedule_days CHECK (
    week_schedule ?& ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  ),
  CONSTRAINT work_automation_disabled_reason_valid CHECK (
    disabled_reason IS NULL OR disabled_reason IN ('client_deleted', 'project_deleted')
  ),
  -- Wlaczony automat bez klienta nie ma czego zapisac — blokada juz w bazie.
  CONSTRAINT work_automation_enabled_needs_client CHECK (NOT enabled OR client_id IS NOT NULL)
);

-- Cron czyta wylacznie wlaczone wiersze.
CREATE INDEX IF NOT EXISTS idx_work_automation_settings_enabled
  ON public.work_automation_settings (user_id)
  WHERE enabled;

ALTER TABLE public.work_automation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_automation_settings_select_own" ON public.work_automation_settings;
CREATE POLICY "work_automation_settings_select_own" ON public.work_automation_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_automation_settings_insert_own" ON public.work_automation_settings;
CREATE POLICY "work_automation_settings_insert_own" ON public.work_automation_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_automation_settings_update_own" ON public.work_automation_settings;
CREATE POLICY "work_automation_settings_update_own" ON public.work_automation_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Historia konfiguracji ────────────────────────────────────────────────────
-- Snapshot bez kluczy obcych: usuniecie klienta nie moze przepisac historii,
-- bo wtedy nie dalo by sie odtworzyc, na jakich zasadach powstal stary wpis.

CREATE TABLE IF NOT EXISTS public.work_automation_setting_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enabled BOOLEAN NOT NULL,
  start_date DATE NOT NULL,
  run_time TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  week_schedule JSONB NOT NULL,
  client_id UUID,
  project_id UUID
);

CREATE INDEX IF NOT EXISTS idx_work_automation_versions_lookup
  ON public.work_automation_setting_versions (user_id, effective_from DESC);

ALTER TABLE public.work_automation_setting_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_automation_versions_select_own" ON public.work_automation_setting_versions;
CREATE POLICY "work_automation_versions_select_own" ON public.work_automation_setting_versions
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT idzie z triggera, ktory chodzi z prawami zapisujacego uzytkownika.
DROP POLICY IF EXISTS "work_automation_versions_insert_own" ON public.work_automation_setting_versions;
CREATE POLICY "work_automation_versions_insert_own" ON public.work_automation_setting_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.work_automation_snapshot_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.work_automation_setting_versions (
    user_id, enabled, start_date, run_time, time_zone, week_schedule, client_id, project_id
  ) VALUES (
    NEW.user_id, NEW.enabled, NEW.start_date, NEW.run_time, NEW.time_zone,
    NEW.week_schedule, NEW.client_id, NEW.project_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_automation_snapshot_insert ON public.work_automation_settings;
CREATE TRIGGER trg_work_automation_snapshot_insert
AFTER INSERT ON public.work_automation_settings
FOR EACH ROW
EXECUTE FUNCTION public.work_automation_snapshot_settings();

-- Zapis formularza bez zmiany tresci nie ma dokladac wersji.
DROP TRIGGER IF EXISTS trg_work_automation_snapshot_update ON public.work_automation_settings;
CREATE TRIGGER trg_work_automation_snapshot_update
AFTER UPDATE ON public.work_automation_settings
FOR EACH ROW
WHEN (
  OLD.enabled       IS DISTINCT FROM NEW.enabled
  OR OLD.start_date    IS DISTINCT FROM NEW.start_date
  OR OLD.run_time      IS DISTINCT FROM NEW.run_time
  OR OLD.time_zone     IS DISTINCT FROM NEW.time_zone
  OR OLD.week_schedule IS DISTINCT FROM NEW.week_schedule
  OR OLD.client_id     IS DISTINCT FROM NEW.client_id
  OR OLD.project_id    IS DISTINCT FROM NEW.project_id
)
EXECUTE FUNCTION public.work_automation_snapshot_settings();

-- ── Jawne wznowienie pracy ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_automation_resumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT work_automation_resumptions_unique UNIQUE (user_id, resume_date)
);

CREATE INDEX IF NOT EXISTS idx_work_automation_resumptions_user
  ON public.work_automation_resumptions (user_id, resume_date);

ALTER TABLE public.work_automation_resumptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_automation_resumptions_select_own" ON public.work_automation_resumptions;
CREATE POLICY "work_automation_resumptions_select_own" ON public.work_automation_resumptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_automation_resumptions_insert_own" ON public.work_automation_resumptions;
CREATE POLICY "work_automation_resumptions_insert_own" ON public.work_automation_resumptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_automation_resumptions_delete_own" ON public.work_automation_resumptions;
CREATE POLICY "work_automation_resumptions_delete_own" ON public.work_automation_resumptions
  FOR DELETE USING (auth.uid() = user_id);

-- ── Dziennik decyzji ─────────────────────────────────────────────────────────
-- Klucz glowny (user_id, local_date) daje dwie rzeczy naraz: ponowione
-- wykonanie nie mnozy identycznych wierszy historii, a raz rozstrzygnieta data
-- nie wraca do rozpatrzenia (recznie usunietego wpisu automat nie odtwarza).

CREATE TABLE IF NOT EXISTS public.work_automation_runs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  outcome TEXT NOT NULL,
  reason TEXT NOT NULL,
  hours NUMERIC(4,2),
  entry_id UUID REFERENCES public.work_entries(id) ON DELETE SET NULL,
  config_version_id UUID,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, local_date),
  CONSTRAINT work_automation_runs_outcome_valid CHECK (outcome IN ('created', 'skipped', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_work_automation_runs_recent
  ON public.work_automation_runs (user_id, decided_at DESC);

ALTER TABLE public.work_automation_runs ENABLE ROW LEVEL SECURITY;

-- Tylko odczyt: dziennik zapisuje wylacznie cron (service-role). Uzytkownik nie
-- moze sfalszowac decyzji ani „odblokowac" dnia rozstrzygnietego.
DROP POLICY IF EXISTS "work_automation_runs_select_own" ON public.work_automation_runs;
CREATE POLICY "work_automation_runs_select_own" ON public.work_automation_runs
  FOR SELECT USING (auth.uid() = user_id);

-- ── Utrata klienta / projektu ────────────────────────────────────────────────
-- BEFORE DELETE, zeby zdazyc przed `ON DELETE SET NULL` — po nim nie dalo by
-- sie juz odroznic „usunieto projekt" od „projekt nie byl ustawiony".

CREATE OR REPLACE FUNCTION public.work_automation_disable_on_reference_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_TABLE_NAME = 'clients' THEN
    UPDATE public.work_automation_settings
       SET enabled = FALSE, disabled_reason = 'client_deleted'
     WHERE user_id = OLD.user_id AND client_id = OLD.id;
  ELSE
    UPDATE public.work_automation_settings
       SET enabled = FALSE, disabled_reason = 'project_deleted'
     WHERE user_id = OLD.user_id AND project_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_automation_client_deleted ON public.clients;
CREATE TRIGGER trg_work_automation_client_deleted
BEFORE DELETE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.work_automation_disable_on_reference_delete();

DROP TRIGGER IF EXISTS trg_work_automation_project_deleted ON public.projects;
CREATE TRIGGER trg_work_automation_project_deleted
BEFORE DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.work_automation_disable_on_reference_delete();
