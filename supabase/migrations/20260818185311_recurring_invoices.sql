-- Recurring invoice templates. Each row describes "how to issue this invoice
-- on a schedule". A nightly job creates concrete invoice_line_items children
-- copies + invoice row based on these templates.

CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'PLN' CHECK (currency IN ('PLN', 'EUR')),
  template_key TEXT NOT NULL DEFAULT 'classic',
  template_accent_color TEXT,
  template_footer TEXT,
  notes TEXT,

  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  due_days SMALLINT NOT NULL DEFAULT 14 CHECK (due_days >= 0 AND due_days <= 365),

  start_date DATE NOT NULL,
  end_date DATE,
  next_issue_date DATE NOT NULL,
  last_issued_date DATE,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  paused_at TIMESTAMPTZ,

  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user ON public.recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_due
  ON public.recurring_invoices(user_id, next_issue_date)
  WHERE is_active = TRUE;

ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recurring_select_own" ON public.recurring_invoices;
CREATE POLICY "recurring_select_own" ON public.recurring_invoices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_insert_own" ON public.recurring_invoices;
CREATE POLICY "recurring_insert_own" ON public.recurring_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_update_own" ON public.recurring_invoices;
CREATE POLICY "recurring_update_own" ON public.recurring_invoices FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_delete_own" ON public.recurring_invoices;
CREATE POLICY "recurring_delete_own" ON public.recurring_invoices FOR DELETE USING (auth.uid() = user_id);

-- Touch updated_at on change.
CREATE OR REPLACE FUNCTION public.touch_recurring_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_recurring ON public.recurring_invoices;
CREATE TRIGGER trg_touch_recurring
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_recurring_invoice();
