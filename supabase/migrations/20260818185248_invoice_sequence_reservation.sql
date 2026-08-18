-- Atomic invoice numbering that stays in sync with manual invoices.
CREATE TABLE IF NOT EXISTS public.invoice_sequence_counters (
  user_id UUID NOT NULL,
  prefix TEXT NOT NULL,
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, prefix, year, month)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_user_invoice_number_unique
  ON public.invoices (user_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.reserve_invoice_sequence(
  p_user_id UUID,
  p_prefix TEXT,
  p_issue_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT := upper(trim(coalesce(p_prefix, '')));
  v_year SMALLINT := EXTRACT(YEAR FROM p_issue_date)::SMALLINT;
  v_month SMALLINT := EXTRACT(MONTH FROM p_issue_date)::SMALLINT;
  v_max_from_invoices INTEGER := 0;
  v_last_seq INTEGER := 0;
BEGIN
  IF v_prefix = '' THEN
    v_prefix := 'FV';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || v_prefix || ':' || v_year::text || ':' || v_month::text, 0)
  );

  SELECT
    COALESCE(MAX(
      CASE
        WHEN split_part(invoice_number, '/', 2) = lpad(v_month::text, 2, '0')
         AND split_part(invoice_number, '/', 3) = v_year::text
         AND left(invoice_number, length(v_prefix) + 1) = v_prefix || ' '
        THEN NULLIF(split_part(split_part(invoice_number, '/', 1), ' ', 2), '')::INTEGER
        ELSE NULL
      END
    ), 0)
  INTO v_max_from_invoices
  FROM public.invoices
  WHERE user_id = p_user_id
    AND invoice_number IS NOT NULL;

  INSERT INTO public.invoice_sequence_counters (user_id, prefix, year, month, last_seq, updated_at)
  VALUES (p_user_id, v_prefix, v_year, v_month, v_max_from_invoices, NOW())
  ON CONFLICT (user_id, prefix, year, month) DO UPDATE
  SET
    last_seq = GREATEST(public.invoice_sequence_counters.last_seq, EXCLUDED.last_seq),
    updated_at = NOW();

  UPDATE public.invoice_sequence_counters
  SET last_seq = last_seq + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND prefix = v_prefix
    AND year = v_year
    AND month = v_month
  RETURNING last_seq INTO v_last_seq;

  RETURN v_last_seq;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_invoice_sequence(UUID, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_invoice_sequence(UUID, TEXT, DATE) TO authenticated;
