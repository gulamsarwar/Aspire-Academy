import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '@/lib/config';

export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    CONFIG.SUPABASE_URL;

  // Prefer valid service role key if explicitly provided
  const envServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    CONFIG.SUPABASE_SERVICE_ROLE_KEY;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    CONFIG.SUPABASE_ANON_KEY;

  // Use service key if available to bypass RLS policies; otherwise fallback to anon key
  const key =
    envServiceKey && envServiceKey.length > 20
      ? envServiceKey
      : anonKey;

  if (!supabaseUrl || !key) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
