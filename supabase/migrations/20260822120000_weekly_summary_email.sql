-- Automatyczna wysylka tygodniowego skrotu dla ksiegowej.
--
-- Jeden wiersz na uzytkownika: adres odbiorcy, przelacznik i znacznik
-- ostatnio wyslanego tygodnia ISO. Znacznik daje idempotencje — cron
-- (sobota) i reczne uruchomienie workflow nie wysla tego samego tygodnia
-- dwa razy.

CREATE TABLE IF NOT EXISTS public.weekly_summary_email_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  recipient_email TEXT,
  last_sent_week_year SMALLINT,
  last_sent_week_number SMALLINT,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT weekly_summary_recipient_format CHECK (
    recipient_email IS NULL
    OR recipient_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  -- Wlaczony automat bez odbiorcy nie ma co zrobic — blokada juz w bazie,
  -- zeby cron nie musial zgadywac.
  CONSTRAINT weekly_summary_enabled_needs_recipient CHECK (
    NOT enabled OR recipient_email IS NOT NULL
  )
);

-- Cron czyta wylacznie wlaczone wiersze.
CREATE INDEX IF NOT EXISTS idx_weekly_summary_email_enabled
  ON public.weekly_summary_email_settings (user_id)
  WHERE enabled;

ALTER TABLE public.weekly_summary_email_settings ENABLE ROW LEVEL SECURITY;

-- Zapis i odczyt idzie z sesji uzytkownika (anon key + ciasteczka).
-- Cron uzywa klucza service-role, ktory RLS omija i filtruje po `user_id` sam.
DROP POLICY IF EXISTS "weekly_summary_email_select_own" ON public.weekly_summary_email_settings;
CREATE POLICY "weekly_summary_email_select_own" ON public.weekly_summary_email_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "weekly_summary_email_insert_own" ON public.weekly_summary_email_settings;
CREATE POLICY "weekly_summary_email_insert_own" ON public.weekly_summary_email_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "weekly_summary_email_update_own" ON public.weekly_summary_email_settings;
CREATE POLICY "weekly_summary_email_update_own" ON public.weekly_summary_email_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
