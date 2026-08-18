-- Per-client auto invoicing settings and helper RPC for scheduler (Supabase).

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS auto_invoice_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_invoice_frequency TEXT NOT NULL DEFAULT 'weekly';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_auto_invoice_frequency_check'
  ) THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT clients_auto_invoice_frequency_check
      CHECK (auto_invoice_frequency IN ('weekly', 'monthly'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_auto_invoice
  ON public.clients (user_id, auto_invoice_enabled, auto_invoice_frequency);
