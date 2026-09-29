import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase URL or Publishable/Anon key missing in environment variables. Please check your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
