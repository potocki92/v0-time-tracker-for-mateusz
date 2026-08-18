-- Add missing project fields used by the Projects module
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS current_quantity NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Normalize default values for status and budget type
ALTER TABLE public.projects
  ALTER COLUMN status SET DEFAULT 'planned',
  ALTER COLUMN budget_type SET DEFAULT 'hourly';

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(user_id, status);
