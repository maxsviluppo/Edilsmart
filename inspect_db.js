import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jawostqqaidelrugtvjd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphd29zdHFxYWlkZWxydWd0dmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTMwMTIsImV4cCI6MjA4NjQ4OTAxMn0._mHfykSxJ0I-zNF6LItYDTnR9D_1120woXOHy4iDwR8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    const tables = ['employees', 'expenses', 'payroll'];
    for (const table of tables) {
        console.log(`Inspecting ${table}...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Found data in ${table}:`, Object.keys(data[0]));
        } else {
            console.log(`No data in ${table}`);
        }
    }
}
inspect();
