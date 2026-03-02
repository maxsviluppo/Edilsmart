-- Query per configurare l'archiviazione dei file dei cantieri
-- Esegui questa query nel SQL Editor di Supabase

-- 1. Tabella per i metadati dei file
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Policy per la tabella
CREATE POLICY "Gli utenti possono gestire i propri file dei cantieri"
ON public.project_files
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 2. Configurazione Storage (Istruzioni)
-- NOTA: I bucket non possono essere creati via SQL in modo affidabile su tutti i piani.
-- E' necessario andare nel dashboard di Supabase -> Storage -> New Bucket
-- E creare un bucket chiamato 'project-files' (impostarlo come PUBLIC per semplicità di condivisione)

-- Policy per il bucket 'project-files' (se creato via Dashboard)
-- Queste policy assicurano che gli utenti possano caricare solo i propri file
/*
CREATE POLICY "Accesso pubblico ai file dei cantieri"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-files');

CREATE POLICY "Caricamento file per utenti autenticati"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Eliminazione file proprietari"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');
*/
