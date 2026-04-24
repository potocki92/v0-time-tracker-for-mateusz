-- Persistent log of reminder emails sent per invoice. Also used for
-- idempotency so the daily cron never double-sends.

CREATE TABLE IF NOT EXISTS public.invoice_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_kind TEXT NOT NULL
    CHECK (reminder_kind IN ('UPCOMING_3D', 'DUE_TODAY', 'OVERDUE_3D', 'OVERDUE_7D', 'OVERDUE_14D', 'MANUAL')),
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice
  ON public.invoice_reminders_sent (invoice_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_reminders_idempotency
  ON public.invoice_reminders_sent (invoice_id, reminder_kind, (sent_at::date))
  WHERE error_message IS NULL;

ALTER TABLE public.invoice_reminders_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_select_own" ON public.invoice_reminders_sent;
CREATE POLICY "reminders_select_own" ON public.invoice_reminders_sent
  FOR SELECT USING (auth.uid() = user_id);

-- Inserts are performed by a SECURITY DEFINER function invoked from the
-- Edge Function / scheduled job, not directly from the client.

-- Per-client opt-out toggle.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Helper view: candidates for reminder on a given day.
CREATE OR REPLACE VIEW public.v_invoice_reminder_candidates AS
SELECT
  i.id AS invoice_id,
  i.user_id,
  i.invoice_number,
  i.name,
  i.status,
  i.due_date,
  i.currency,
  COALESCE(i.gross_amount, i.amount) AS amount,
  i.client_id,
  c.email AS client_email,
  c.name AS client_name,
  c.reminders_enabled AS reminders_enabled,
  CASE
    WHEN i.due_date - CURRENT_DATE = 3 THEN 'UPCOMING_3D'
    WHEN i.due_date = CURRENT_DATE THEN 'DUE_TODAY'
    WHEN CURRENT_DATE - i.due_date = 3 THEN 'OVERDUE_3D'
    WHEN CURRENT_DATE - i.due_date = 7 THEN 'OVERDUE_7D'
    WHEN CURRENT_DATE - i.due_date = 14 THEN 'OVERDUE_14D'
    ELSE NULL
  END AS reminder_kind
FROM public.invoices i
LEFT JOIN public.clients c ON c.id = i.client_id
WHERE i.status IN ('SENT', 'OVERDUE')
  AND i.is_paid = FALSE
  AND i.due_date IS NOT NULL
  AND c.email IS NOT NULL
  AND c.reminders_enabled = TRUE;

GRANT SELECT ON public.v_invoice_reminder_candidates TO authenticated;
