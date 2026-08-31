import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://jawostqqaidelrugtvjd.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphd29zdHFxYWlkZWxydWd0dmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTMwMTIsImV4cCI6MjA4NjQ4OTAxMn0._mHfykSxJ0I-zNF6LItYDTnR9D_1120woXOHy4iDwR8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const PROJECT_FILES_BUCKET = 'project-files';
