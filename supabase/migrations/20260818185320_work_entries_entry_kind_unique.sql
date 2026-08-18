-- Allow real + predicted entries on the same day for one user.
ALTER TABLE public.work_entries
  ADD COLUMN IF NOT EXISTS entry_kind TEXT NOT NULL DEFAULT 'real'
  CHECK (entry_kind IN ('real', 'predicted'));

ALTER TABLE public.work_entries
  DROP CONSTRAINT IF EXISTS work_entries_user_id_date_key;

ALTER TABLE public.work_entries
  ADD CONSTRAINT work_entries_user_id_date_entry_kind_key
  UNIQUE (user_id, date, entry_kind);

CREATE INDEX IF NOT EXISTS idx_work_entries_entry_kind
  ON public.work_entries(entry_kind);
