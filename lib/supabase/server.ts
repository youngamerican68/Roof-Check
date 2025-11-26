import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server client for server-side operations (API routes, Server Components)
// Uses the service role key which bypasses Row Level Security
// NEVER expose this client to the browser
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get a fresh server client for each request
// This ensures no state leakage between requests
export function getSupabaseServerClient() {
  return createServerClient();
}
