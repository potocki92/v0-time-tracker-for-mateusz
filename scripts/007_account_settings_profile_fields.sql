-- Extend profiles table for account settings module.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- Backfill first_name / last_name from existing full_name when possible.
UPDATE public.profiles
SET
  first_name = COALESCE(first_name, NULLIF(split_part(full_name, ' ', 1), '')),
  last_name = COALESCE(
    last_name,
    NULLIF(
      trim(regexp_replace(full_name, '^\S+\s*', '')),
      ''
    )
  )
WHERE full_name IS NOT NULL;

-- Keep username unique but nullable.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (username)
  WHERE username IS NOT NULL;
