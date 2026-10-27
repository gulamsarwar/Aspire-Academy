import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Public Supabase Configuration Endpoint
 * Safely provides public Supabase client credentials (URL & anon key) to the browser.
 * NEVER exposes service-role keys or payment gateway secrets.
 */
export async function GET() {
  const supabaseUrl = CONFIG.SUPABASE_URL;
  const anonKey = CONFIG.SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    anonKey &&
    supabaseUrl.startsWith('https://') &&
    anonKey.length > 15
  );

  let googleEnabled = false;
  let emailEnabled = true;

  if (isConfigured) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: anonKey },
        cache: 'no-store',
      });
      if (res.ok) {
        const settings = await res.json();
        googleEnabled = Boolean(settings.external?.google);
        emailEnabled = Boolean(settings.external?.email ?? true);
      }
    } catch {
      // fallback
    }
  }

  return NextResponse.json({
    configured: isConfigured,
    supabaseUrl: isConfigured ? supabaseUrl : null,
    anonKey: isConfigured ? anonKey : null,
    siteUrl: CONFIG.APP_URL,
    providers: {
      google: googleEnabled,
      email: emailEnabled,
    },
    googleEnabled,
    missingVariables: [],
  });
}
