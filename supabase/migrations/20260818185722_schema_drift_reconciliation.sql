-- Wyrownanie migracji do schematu, ktory faktycznie ma produkcja.
--
-- Aplikacja zapisuje i czyta dwie kolumny, ktorych zaden plik w `scripts/`
-- nigdy nie zakladal — musialy powstac recznie w panelu Supabase:
--
--   * `invoices.issue_date`  — kazda sciezka zapisu faktury ustawia te kolumne
--     (invoices.service.server.ts, invoices.fetchers.ts, import CSV),
--     a widoki czytaja ja jako fallback dla `invoice_date`;
--   * `work_entries.notes`   — formularz dnia w kalendarzu zapisuje `notes`,
--     a lista/tooltip/insighty ja wyswietlaja. Migracja `create_tables`
--     zalozyla `note`, ktorej kod nie uzywa nigdzie.
--
-- Bez tej migracji `supabase db reset` daje baze, na ktorej kalendarz i
-- fakturowanie sie wywracaja, a `idx_invoices_user_issue` w ogole nie powstaje.
--
-- Wszystko jest `IF NOT EXISTS` + warunkowy backfill, wiec na produkcji
-- (gdzie obie kolumny juz sa) migracja jest praktycznie no-opem.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS issue_date DATE;

-- Wiersze sprzed dodania kolumny maja NULL. Paginacja kursorowa sortuje po
-- `issue_date`, wiec NULL-e rozjezdzalyby kolejnosc — uzupelniamy z `invoice_date`
-- (kazda sciezka zapisu i tak ustawia obie kolumny na te sama date).
UPDATE public.invoices
SET issue_date = invoice_date
WHERE issue_date IS NULL;

ALTER TABLE public.work_entries
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ten sam zabieg co migracja `invoices_upgrade` zrobila dla `invoices.note`.
UPDATE public.work_entries
SET notes = note
WHERE notes IS NULL
  AND note IS NOT NULL;
