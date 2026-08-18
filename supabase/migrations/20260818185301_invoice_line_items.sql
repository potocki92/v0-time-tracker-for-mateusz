-- Full invoice line items: one row per billable position with its own
-- description, quantity, unit price and VAT rate.
-- Required for proper VAT invoices and JPK_FA exports.

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  position SMALLINT NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'szt.',

  quantity NUMERIC(12, 3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_net NUMERIC(12, 2) NOT NULL CHECK (unit_price_net >= 0),
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 23 CHECK (vat_rate >= 0 AND vat_rate <= 100),

  -- Totals persisted for reporting. Kept in sync via trigger below.
  net_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  gross_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_user ON public.invoice_line_items(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_line_items_position
  ON public.invoice_line_items(invoice_id, position);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "line_items_select_own" ON public.invoice_line_items;
CREATE POLICY "line_items_select_own" ON public.invoice_line_items FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "line_items_insert_own" ON public.invoice_line_items;
CREATE POLICY "line_items_insert_own" ON public.invoice_line_items FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "line_items_update_own" ON public.invoice_line_items;
CREATE POLICY "line_items_update_own" ON public.invoice_line_items FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "line_items_delete_own" ON public.invoice_line_items;
CREATE POLICY "line_items_delete_own" ON public.invoice_line_items FOR DELETE USING (auth.uid() = user_id);

-- Expose net/VAT/gross totals on the parent invoice so reporting queries don't
-- always have to join.
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(14, 2);

-- Recompute a single line's totals before write.
CREATE OR REPLACE FUNCTION public.compute_invoice_line_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.net_amount := ROUND(NEW.quantity * NEW.unit_price_net, 2);
  NEW.vat_amount := ROUND(NEW.net_amount * NEW.vat_rate / 100, 2);
  NEW.gross_amount := NEW.net_amount + NEW.vat_amount;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_line_totals ON public.invoice_line_items;
CREATE TRIGGER trg_compute_line_totals
  BEFORE INSERT OR UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_invoice_line_totals();

-- Recompute the invoice-level totals whenever its lines change.
CREATE OR REPLACE FUNCTION public.recompute_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id UUID := COALESCE(NEW.invoice_id, OLD.invoice_id);
  v_net NUMERIC(14, 2);
  v_vat NUMERIC(14, 2);
  v_gross NUMERIC(14, 2);
BEGIN
  SELECT
    COALESCE(SUM(net_amount), 0),
    COALESCE(SUM(vat_amount), 0),
    COALESCE(SUM(gross_amount), 0)
  INTO v_net, v_vat, v_gross
  FROM public.invoice_line_items
  WHERE invoice_id = v_invoice_id;

  UPDATE public.invoices
  SET net_amount = v_net,
      vat_amount = v_vat,
      gross_amount = v_gross,
      -- Mirror the gross amount on the legacy "amount" column for back-compat.
      amount = v_gross,
      updated_at = NOW()
  WHERE id = v_invoice_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_invoice_totals ON public.invoice_line_items;
CREATE TRIGGER trg_recompute_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_invoice_totals();
