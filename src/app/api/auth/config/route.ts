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

  return NextResponse.json({
    configured: isConfigured,
    supabaseUrl: isConfigured ? supabaseUrl : null,
    anonKey: isConfigured ? anonKey : null,
    siteUrl: CONFIG.APP_URL,
    missingVariables: [],
  });
}
