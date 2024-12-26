import { createClient } from '@supabase/supabase-js';
// import { EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';
// import { EXPO_PUBLIC_SUPABASE_URL} from '@env';



// Replace these with your Supabase project details
const SUPABASE_URL = "https://gxhqfynolyjyzscmddmi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4aHFmeW5vbHlqeXpzY21kZG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzMwNzgsImV4cCI6MjA1MDUwOTA3OH0.zn7cS9SZahj7s04jE_lMHybwPn9hO7HpvaId3uAcxeM";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
