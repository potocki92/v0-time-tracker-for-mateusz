-- Replace the is_paid boolean with an explicit invoice lifecycle status.
-- is_paid is KEPT for backwards compatibility with existing UI that still
-- reads/writes the flag; new code should use status.
--
-- Status values:
--   DRAFT     – freshly created, not yet sent to client
--   SENT      – delivered to client, awaiting payment
--   PAID      – fully paid
--   OVERDUE   – past due_date and not paid
--   CANCELLED – voided (e.g. correction issued)

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS status public.invoice_status;

-- Backfill for existing rows.
UPDATE public.invoices
SET status = CASE
  WHEN is_paid = TRUE THEN 'PAID'::public.invoice_status
  WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'OVERDUE'::public.invoice_status
  WHEN invoice_number IS NULL THEN 'DRAFT'::public.invoice_status
  ELSE 'SENT'::public.invoice_status
END
WHERE status IS NULL;

ALTER TABLE public.invoices
  ALTER COLUMN status SET DEFAULT 'DRAFT',
  ALTER COLUMN status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_user_status
  ON public.invoices (user_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_overdue_candidates
  ON public.invoices (user_id, due_date)
  WHERE status IN ('SENT', 'OVERDUE') AND is_paid = FALSE;

-- Keep is_paid and status in sync when either side is updated.
CREATE OR REPLACE FUNCTION public.sync_invoice_payment_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'PAID' THEN
      NEW.is_paid := TRUE;
      IF NEW.paid_date IS NULL THEN
        NEW.paid_date := CURRENT_DATE;
      END IF;
    ELSIF NEW.status IN ('DRAFT', 'SENT', 'OVERDUE', 'CANCELLED') THEN
      NEW.is_paid := FALSE;
      IF TG_OP = 'UPDATE' AND OLD.status = 'PAID' THEN
        NEW.paid_date := NULL;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_paid IS DISTINCT FROM OLD.is_paid THEN
    -- Support legacy callers that still flip is_paid directly.
    IF NEW.is_paid = TRUE AND NEW.status <> 'PAID' THEN
      NEW.status := 'PAID';
      IF NEW.paid_date IS NULL THEN
        NEW.paid_date := CURRENT_DATE;
      END IF;
    ELSIF NEW.is_paid = FALSE AND NEW.status = 'PAID' THEN
      NEW.status := CASE
        WHEN NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN 'OVERDUE'::public.invoice_status
        ELSE 'SENT'::public.invoice_status
      END;
      NEW.paid_date := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_invoice_payment_flag ON public.invoices;
CREATE TRIGGER trg_sync_invoice_payment_flag
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_payment_flag();

-- Scheduled function that promotes SENT invoices past their due date to OVERDUE.
-- Intended to be invoked daily (pg_cron or an Edge Function).
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.invoices
  SET status = 'OVERDUE'
  WHERE status = 'SENT'
    AND is_paid = FALSE
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_overdue_invoices() TO service_role;

-- Add due_date >= invoice_date check.
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_due_after_issue;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_due_after_issue
  CHECK (due_date IS NULL OR invoice_date IS NULL OR due_date >= invoice_date);
