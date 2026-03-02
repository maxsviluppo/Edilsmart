-- CORRETTORE DATABASE PER EDILSMART - GESTIONE FORNITORI E PROFILI
-- Esegui questo script nell'editor SQL di Supabase

-- 1. Tabella Fornitori (Suppliers)
-- Creiamo la tabella se non esiste, con vincoli corretti
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
    name text NOT NULL,
    vat_number text,
    email text,
    phone text,
    category text,
    note text,
    created_at timestamptz DEFAULT now()
);

-- 2. Estensione Profilo (Profiles)
-- Aggiungiamo le colonne necessarie al profilo esistente in modo sicuro
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accounting_categories TEXT[] DEFAULT '{"Materiali", "Ricavi", "Manodopera", "Noleggi", "Materiali Speciali", "Altro"}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_measurements TEXT[] DEFAULT '{"M", "M2", "M3", "ML", "A CORPO", "Cad.UNO"}';

-- 3. Abilitazione Sicurezza (RLS)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 4. Policy di Sicurezza (RLS)
-- Rimuoviamo eventuali policy vecchie o errate
DROP POLICY IF EXISTS "Users view own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can manage their suppliers" ON public.suppliers;

-- Creiamo una policy completa che copre SELECT, INSERT, UPDATE, DELETE
-- 'WITH CHECK' è essenziale per impedire inserimenti a nome di altri utenti
CREATE POLICY "Users fully own their suppliers"
ON public.suppliers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Trigger Gestione Nuovi Utenti (Robustezza)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 'ON CONFLICT DO NOTHING' previene blocchi se il profilo esiste già (es. migrazioni)
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'user', 'active')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ricreazione Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
