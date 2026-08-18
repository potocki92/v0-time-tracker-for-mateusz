-- Work address for projects.
--
-- The weekly summary (copy-to-clipboard report for the accountant) needs to
-- state *where* the work was physically performed in a given week. That place
-- is tied to the project, not the client, so we store it on `projects`.
--
-- Adding it as nullable TEXT keeps existing rows untouched (NULL) and lets the
-- project form persist a free-form address (e.g. "ul. Słoneczna 10, 80-001
-- Gdańsk").

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS address TEXT;
