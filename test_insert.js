import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jawostqqaidelrugtvjd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphd29zdHFxYWlkZWxydWd0dmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTMwMTIsImV4cCI6MjA4NjQ4OTAxMn0._mHfykSxJ0I-zNF6LItYDTnR9D_1120woXOHy4iDwR8';

async function testInsert() {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("Testing insert with 'description'...");
    const { data, error } = await supabase.from('projects').insert([{
        name: 'Test Desc',
        client: 'Test Client',
        description: 'This is a test'
    }]).select();

    if (error) {
        console.error("DEBUG INSERT ERROR (description):", error.message);
    } else {
        console.log("Success with description! Data:", data);
    }
}

testInsert();
