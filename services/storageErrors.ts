type SupabaseLikeError = {
  message?: string;
  statusCode?: string | number;
  error?: string;
  name?: string;
};

export function formatStorageError(error: unknown): string {
  if (!error) {
    return "Errore sconosciuto durante il caricamento del file.";
  }

  if (error instanceof Error && !('statusCode' in error)) {
    return error.message;
  }

  const err = error as SupabaseLikeError;
  const message = `${err.message || ''} ${err.error || ''}`.toLowerCase();

  if (message.includes('not authenticated') || message.includes('jwt') || message.includes('session')) {
    return 'Sessione scaduta. Esci e accedi di nuovo al pannello.';
  }

  if (message.includes('bucket not found') || message.includes('does not exist')) {
    return "Bucket 'project-files' non trovato su Supabase. Crea il bucket publico dal dashboard Storage.";
  }

  if (message.includes('row-level security') || message.includes('policy') || message.includes('unauthorized')) {
    return 'Permessi storage insufficienti. Esegui lo script SUPABASE_PROJECT_FILES.sql nel SQL Editor di Supabase.';
  }

  if (message.includes('42p01') || message.includes('project_files')) {
    return "Tabella 'project_files' mancante. Esegui lo script SUPABASE_PROJECT_FILES.sql nel SQL Editor di Supabase.";
  }

  if (message.includes('column') && message.includes('photos')) {
    return "Colonna 'photos' mancante sulla tabella projects. Esegui SUPABASE_PHOTOS_FIX.sql nel SQL Editor.";
  }

  if (message.includes('permission denied') || message.includes('42501')) {
    return 'Permesso negato sul database. Esegui SUPABASE_PHOTOS_FIX.sql e verifica di essere loggato.';
  }

  if (message.includes('payload too large') || message.includes('entity too large')) {
    return 'File troppo grande per il limite configurato su Supabase Storage.';
  }

  return err.message || err.error || 'Errore durante il caricamento del file.';
}
