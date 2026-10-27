import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '@/lib/config';

let cachedClient: SupabaseClient | null = null;
let runtimeUrl: string | null = null;
let runtimeKey: string | null = null;

export function setRuntimeSupabaseConfig(url: string, key: string) {
  if (url && key && (runtimeUrl !== url || runtimeKey !== key)) {
    runtimeUrl = url;
    runtimeKey = key;
    cachedClient = null; // Re-instantiate with new credentials
  }
}

export function getSupabaseClientDiagnostic() {
  const url = runtimeUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || CONFIG.SUPABASE_URL || '';
  const key =
    runtimeKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    CONFIG.SUPABASE_ANON_KEY ||
    '';

  const hasValidUrl = Boolean(
    url &&
    url.startsWith('https://') &&
    !url.includes('your-project-id')
  );
  const hasValidKey = Boolean(key && key.length > 15);

  const missing: string[] = [];
  if (!hasValidUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!hasValidKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return {
    isConfigured: hasValidUrl && hasValidKey,
    hasValidUrl,
    hasValidKey,
    url: hasValidUrl ? url : null,
    missing,
  };
}

export function createClient(): SupabaseClient | null {
  const diagnostic = getSupabaseClientDiagnostic();
  if (!diagnostic.isConfigured) {
    return null;
  }

  const supabaseUrl =
    runtimeUrl ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    CONFIG.SUPABASE_URL;
  const supabaseKey =
    runtimeKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    CONFIG.SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined') {
    if (!cachedClient) {
      cachedClient = createBrowserClient(supabaseUrl, supabaseKey);
    }
    return cachedClient;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
