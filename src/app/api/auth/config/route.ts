import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public Supabase Configuration Endpoint
 * Safely provides public Supabase client credentials (URL & anon key) to the browser.
 * NEVER exposes service-role keys or payment gateway secrets.
 */
export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  const isConfigured = Boolean(
    supabaseUrl &&
    anonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id') &&
    anonKey.length > 15
  );

  return NextResponse.json({
    configured: isConfigured,
    supabaseUrl: isConfigured ? supabaseUrl : null,
    anonKey: isConfigured ? anonKey : null,
    siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://aspire-academy.pages.dev',
    missingVariables: isConfigured
      ? []
      : [
          !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
          !anonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
        ].filter(Boolean),
  });
}
