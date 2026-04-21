-- Snapshot stawek na wpisach pracy.
-- Cel: zmiana `clients.rate` / `client_rates` nie może retroaktywnie zmieniać
-- kwot już zapisanych wpisów.

ALTER TABLE public.work_entries
  ADD COLUMN IF NOT EXISTS billing_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS billing_currency TEXT,
  ADD COLUMN IF NOT EXISTS billing_work_type TEXT,
  ADD COLUMN IF NOT EXISTS billing_unit TEXT;

-- Funkcja: ustawia snapshot stawki na INSERT/UPDATE (gdy zmienia się klient lub data).
CREATE OR REPLACE FUNCTION public.set_work_entry_billing_snapshot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  rate_row RECORD;
  client_row RECORD;
BEGIN
  IF NEW.client_id IS NULL THEN
    NEW.billing_rate := NULL;
    NEW.billing_currency := NULL;
    NEW.billing_work_type := NULL;
    NEW.billing_unit := NULL;
    RETURN NEW;
  END IF;

  SELECT cr.rate, cr.currency, cr.work_type, cr.unit
  INTO rate_row
  FROM public.client_rates cr
  WHERE cr.client_id = NEW.client_id
    AND cr.user_id = NEW.user_id
    AND cr.effective_from <= NEW.date
  ORDER BY cr.effective_from DESC, cr.created_at DESC
  LIMIT 1;

  IF rate_row IS NOT NULL THEN
    NEW.billing_rate := rate_row.rate;
    NEW.billing_currency := rate_row.currency;
    NEW.billing_work_type := rate_row.work_type;
    NEW.billing_unit := rate_row.unit;
    RETURN NEW;
  END IF;

  -- Fallback: gdy brak historii stawek, użyj aktualnych pól klienta.
  SELECT c.rate, c.currency, c.work_type, c.unit
  INTO client_row
  FROM public.clients c
  WHERE c.id = NEW.client_id
    AND c.user_id = NEW.user_id
  LIMIT 1;

  NEW.billing_rate := client_row.rate;
  NEW.billing_currency := client_row.currency;
  NEW.billing_work_type := client_row.work_type;
  NEW.billing_unit := client_row.unit;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_entries_set_billing_snapshot ON public.work_entries;

CREATE TRIGGER trg_work_entries_set_billing_snapshot
BEFORE INSERT OR UPDATE OF client_id, date
ON public.work_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_work_entry_billing_snapshot();

-- Backfill dla istniejących wpisów.
UPDATE public.work_entries we
SET
  billing_rate = COALESCE(
    (
      SELECT cr.rate
      FROM public.client_rates cr
      WHERE cr.client_id = we.client_id
        AND cr.user_id = we.user_id
        AND cr.effective_from <= we.date
      ORDER BY cr.effective_from DESC, cr.created_at DESC
      LIMIT 1
    ),
    c.rate
  ),
  billing_currency = COALESCE(
    (
      SELECT cr.currency
      FROM public.client_rates cr
      WHERE cr.client_id = we.client_id
        AND cr.user_id = we.user_id
        AND cr.effective_from <= we.date
      ORDER BY cr.effective_from DESC, cr.created_at DESC
      LIMIT 1
    ),
    c.currency
  ),
  billing_work_type = COALESCE(
    (
      SELECT cr.work_type
      FROM public.client_rates cr
      WHERE cr.client_id = we.client_id
        AND cr.user_id = we.user_id
        AND cr.effective_from <= we.date
      ORDER BY cr.effective_from DESC, cr.created_at DESC
      LIMIT 1
    ),
    c.work_type
  ),
  billing_unit = COALESCE(
    (
      SELECT cr.unit
      FROM public.client_rates cr
      WHERE cr.client_id = we.client_id
        AND cr.user_id = we.user_id
        AND cr.effective_from <= we.date
      ORDER BY cr.effective_from DESC, cr.created_at DESC
      LIMIT 1
    ),
    c.unit
  )
FROM public.clients c
WHERE we.client_id IS NOT NULL
  AND c.id = we.client_id
  AND c.user_id = we.user_id
  AND (
    we.billing_rate IS NULL
    OR we.billing_currency IS NULL
    OR we.billing_work_type IS NULL
  );
