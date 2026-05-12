-- Trips (wyjazdy do pracy) — przechowuje zakresy dat ręcznie zdefiniowanych
-- wyjazdów Mateusza, używane przez TripsSection (dashboard) i kalendarz.
-- Zastępuje wcześniejszy storage w localStorage (klucz `mateusz:trips:v1`).

CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  destination TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT trips_dates_valid CHECK (start_date <= end_date)
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trips_select_own" ON public.trips;
DROP POLICY IF EXISTS "trips_insert_own" ON public.trips;
DROP POLICY IF EXISTS "trips_update_own" ON public.trips;
DROP POLICY IF EXISTS "trips_delete_own" ON public.trips;
CREATE POLICY "trips_select_own" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trips_insert_own" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips_update_own" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trips_delete_own" ON public.trips FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date);
