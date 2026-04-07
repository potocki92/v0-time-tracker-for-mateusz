-- WorkFlow Pro Database Schema
-- Tables for time tracking, clients, projects, invoices

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  default_hours NUMERIC(4,2) DEFAULT 8,
  eur_to_pln NUMERIC(6,4) DEFAULT 4.30,
  monthly_goal_amount NUMERIC(12,2),
  monthly_goal_currency TEXT DEFAULT 'PLN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PLN',
  work_type TEXT NOT NULL DEFAULT 'hourly',
  unit TEXT DEFAULT 'h',
  nip TEXT,
  regon TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_select_own" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_insert_own" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update_own" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_delete_own" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  budget_type TEXT DEFAULT 'hourly',
  budget_amount NUMERIC(12,2),
  target_quantity NUMERIC(10,2),
  color TEXT DEFAULT '#3b82f6',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select_own" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Work entries table
CREATE TABLE IF NOT EXISTS public.work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'worked',
  hours NUMERIC(4,2),
  quantity NUMERIC(10,2),
  quantity_from NUMERIC(10,2),
  quantity_to NUMERIC(10,2),
  category TEXT DEFAULT 'work',
  tags TEXT[],
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.work_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_entries_select_own" ON public.work_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "work_entries_insert_own" ON public.work_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "work_entries_update_own" ON public.work_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "work_entries_delete_own" ON public.work_entries FOR DELETE USING (auth.uid() = user_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  billing_period TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  file_url TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_select_own" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "invoices_insert_own" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "invoices_update_own" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "invoices_delete_own" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_work_entries_user_id ON public.work_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_work_entries_date ON public.work_entries(date);
CREATE INDEX IF NOT EXISTS idx_work_entries_client_id ON public.work_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
