import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jawostqqaidelrugtvjd.supabase.co';
// Nota: In un ambiente di produzione, queste chiavi dovrebbero essere in variabili d'ambiente (.env)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphd29zdHFxYWlkZWxydWd0dmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTMwMTIsImV4cCI6MjA4NjQ4OTAxMn0._mHfykSxJ0I-zNF6LItYDTnR9D_1120woXOHy4iDwR8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
