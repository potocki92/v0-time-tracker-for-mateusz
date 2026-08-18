-- Invoice automation and template metadata
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS template_key TEXT DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS template_accent_color TEXT,
  ADD COLUMN IF NOT EXISTS template_footer TEXT,
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS period_start DATE,
  ADD COLUMN IF NOT EXISTS period_end DATE;

CREATE INDEX IF NOT EXISTS idx_invoices_auto_generated_period
  ON public.invoices (user_id, auto_generated, period_start, period_end);
