import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — add them to .env.local and restart the dev server.',
  )
}

// One shared client for the whole app. It reads/writes the database and manages
// the logged-in session (it stores the session in localStorage automatically).
export const supabase = createClient(url, anonKey)
