-- Historical rate tracking for clients.
-- `clients.rate` pozostaje jako "aktualna stawka" (denormalizacja dla szybkiego odczytu).
-- `client_rates` trzyma pełną historię — nowy wpis = nowa stawka obowiązująca od `effective_from`.

CREATE TABLE IF NOT EXISTS public.client_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rate NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  work_type TEXT NOT NULL DEFAULT 'hourly',
  unit TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_rates_client_id ON public.client_rates(client_id);
CREATE INDEX IF NOT EXISTS idx_client_rates_user_id  ON public.client_rates(user_id);
CREATE INDEX IF NOT EXISTS idx_client_rates_effective_from ON public.client_rates(effective_from DESC);

ALTER TABLE public.client_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_rates_select_own" ON public.client_rates;
DROP POLICY IF EXISTS "client_rates_insert_own" ON public.client_rates;
DROP POLICY IF EXISTS "client_rates_update_own" ON public.client_rates;
DROP POLICY IF EXISTS "client_rates_delete_own" ON public.client_rates;

CREATE POLICY "client_rates_select_own" ON public.client_rates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "client_rates_insert_own" ON public.client_rates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "client_rates_update_own" ON public.client_rates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "client_rates_delete_own" ON public.client_rates FOR DELETE USING (auth.uid() = user_id);

-- Seed — dla każdego istniejącego klienta, jeśli brak historii, utwórz pierwszy wpis
-- z datą utworzenia klienta i aktualną stawką.
INSERT INTO public.client_rates (client_id, user_id, rate, currency, work_type, unit, effective_from, note)
SELECT c.id, c.user_id, c.rate, c.currency, c.work_type, c.unit,
       COALESCE(c.created_at::date, CURRENT_DATE),
       'Initial rate'
FROM public.clients c
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_rates cr WHERE cr.client_id = c.id
);
