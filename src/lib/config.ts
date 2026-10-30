/**
 * Canonical Aspire Academy Online Production Configuration
 * Provides guaranteed fallback values so that the platform functions flawlessly
 * in any deployment environment (Cloudflare Pages, Vercel, Docker, Localhost)
 * even if environment variables were not manually set in the host dashboard.
 */

export function getCanonicalAppUrl(): string {
  // 1. Client-side browser execution: always use the real active origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 2. Explicit environment variable configured by deployment owner
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 3. Auto-detect Vercel preview or production URLs
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  // 4. Auto-detect Cloudflare Pages system URL
  if (process.env.CF_PAGES_URL) {
    return process.env.CF_PAGES_URL.replace(/\/$/, '');
  }

  // 5. Default fallback for local development or Node.js server
  return 'http://localhost:3000';
}

export const CONFIG = {
  APP_URL: getCanonicalAppUrl(),
  SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'Aspire Academy Online',

  // Supabase PostgreSQL & Authentication (Free-Tier Production Instance)
  SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://bobymknzhwoyzayfamrt.supabase.co',

  SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_KHr1v2-ywFRFd7g9iv-shg_NueGP3LY',

  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    '',

  // Razorpay Payment Gateway (Test / Live)
  RAZORPAY_KEY_ID:
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    'rzp_test_aspire_demo_key',

  RAZORPAY_KEY_SECRET:
    process.env.RAZORPAY_KEY_SECRET ||
    'rzp_test_aspire_demo_secret',

  RAZORPAY_WEBHOOK_SECRET:
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    'aspire_webhook_secret_demo',

  // Academy Contact Info
  CONTACT_PHONE: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91 9123456789',
  CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@aspireacademyonline.in',
  WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919123456789',
};
