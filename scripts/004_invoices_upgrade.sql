-- Upgrade invoices schema for advanced invoice module
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS recipient TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Keep compatibility with legacy `note` column if it exists
UPDATE public.invoices
SET notes = COALESCE(notes, note)
WHERE notes IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_unpaid ON public.invoices(user_id, is_paid);
