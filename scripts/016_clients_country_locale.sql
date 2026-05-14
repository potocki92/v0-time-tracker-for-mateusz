-- Geography / locale columns for clients.
--
-- These columns were already referenced by the TypeScript types, the regular
-- client form (`ClientFormFields.tsx`) and the invoice buyer block, but no
-- migration had ever added them. PostgREST therefore rejected every UPDATE
-- that touched them — most visibly the "Wystaw fakturę z przepracowanych
-- tygodni" flow, which auto-mirrors the buyer block back onto `clients` on
-- every save and unconditionally included `country_code: 'PL'`.
--
-- Adding them as nullable TEXT keeps existing rows untouched (NULL) and lets
-- the code persist real values (e.g. 'DE' for German clients, used by JPK_FA
-- to emit the correct KodKraju in P_4A).

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS region       TEXT,
  ADD COLUMN IF NOT EXISTS locale       TEXT,
  ADD COLUMN IF NOT EXISTS timezone     TEXT;
