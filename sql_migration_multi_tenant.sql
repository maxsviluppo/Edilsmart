-- ====================================================================
-- EDILSMART - FULL DATABASE SETUP & MULTI-TENANCY (FIXED)
-- Questo script gestisce creazione tabelle, aggiunta colonne mancanti
-- e isolamento dati per multi-utenza.
-- ====================================================================

-- 1. CREAZIONE TABELLE MANCANTI
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.expenses (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.employees (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.payroll (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.clients (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);

-- 2. AGGIUNTA COLONNE E user_id A TABELLE ESISTENTI
-- Questo blocco assicura che ANCHE se la tabella esiste, le colonne necessarie vengano aggiunte
DO $$ 
BEGIN 
    -- PROJECTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='name') THEN
        ALTER TABLE public.projects ADD COLUMN name TEXT NOT NULL DEFAULT 'Nuovo Cantiere';
        ALTER TABLE public.projects ADD COLUMN client TEXT;
        ALTER TABLE public.projects ADD COLUMN location TEXT;
        ALTER TABLE public.projects ADD COLUMN budget NUMERIC DEFAULT 0;
        ALTER TABLE public.projects ADD COLUMN status TEXT DEFAULT 'Pianificato';
        ALTER TABLE public.projects ADD COLUMN start_date DATE;
        ALTER TABLE public.projects ADD COLUMN end_date DATE;
        ALTER TABLE public.projects ADD COLUMN iva NUMERIC DEFAULT 10;
        ALTER TABLE public.projects ADD COLUMN progress NUMERIC DEFAULT 0;
        ALTER TABLE public.projects ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- AGGIUNTA user_id A TUTTE LE TABELLE (Se mancante)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='user_id') THEN
        ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='user_id') THEN
        ALTER TABLE public.expenses ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='user_id') THEN
        ALTER TABLE public.employees ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payroll' AND column_name='user_id') THEN
        ALTER TABLE public.payroll ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='user_id') THEN
        ALTER TABLE public.clients ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- Altre colonne per EXPENSES (Esempio)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='amount') THEN
        ALTER TABLE public.expenses ADD COLUMN date DATE DEFAULT CURRENT_DATE;
        ALTER TABLE public.expenses ADD COLUMN description TEXT;
        ALTER TABLE public.expenses ADD COLUMN amount NUMERIC DEFAULT 0;
        ALTER TABLE public.expenses ADD COLUMN category TEXT;
        ALTER TABLE public.expenses ADD COLUMN status TEXT DEFAULT 'In Attesa';
        ALTER TABLE public.expenses ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;

END $$;

-- 3. ABILITAZIONE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 4. CREAZIONE POLICY PER ISOLAMENTO DATI
DO $$ 
BEGIN
    -- PROFILES
    DROP POLICY IF EXISTS "Users can only see their own profile" ON public.profiles;
    CREATE POLICY "Users can only see their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

    -- PROJECTS
    DROP POLICY IF EXISTS "Users view own projects" ON public.projects;
    CREATE POLICY "Users view own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

    -- EXPENSES
    DROP POLICY IF EXISTS "Users view own expenses" ON public.expenses;
    CREATE POLICY "Users view own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);

    -- EMPLOYEES
    DROP POLICY IF EXISTS "Users view own employees" ON public.employees;
    CREATE POLICY "Users view own employees" ON public.employees FOR ALL USING (auth.uid() = user_id);

    -- PAYROLL
    DROP POLICY IF EXISTS "Users view own payroll" ON public.payroll;
    CREATE POLICY "Users view own payroll" ON public.payroll FOR ALL USING (auth.uid() = user_id);

    -- CLIENTS
    DROP POLICY IF EXISTS "Users view own clients" ON public.clients;
    CREATE POLICY "Users view own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
END $$;
