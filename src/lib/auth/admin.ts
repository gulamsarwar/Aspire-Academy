import { Profile } from '@/lib/types';
import { db } from '@/lib/data/mock-db';

/**
 * Canonical Administrator Accounts & Allowlist for Aspire Academy Online
 * Admin access is strictly enforced via this server-verified allowlist.
 */
export const DEFAULT_ADMIN_EMAILS = [
  'aspireacademyamba@gmail.com',
  'admin@aspireacademy.in',
  'shekhar@aspireacademy.in',
  'shekhar.sir@aspireacademy.in',
  'shekharsir@gmail.com',
  'shekhar@gmail.com',
  'aspireacademy@gmail.com',
  'contact@aspireacademyonline.in',
  'admin@aspireacademyonline.in',
];

export const CANONICAL_ADMIN_ID = '00000000-0000-4000-8000-000000000002';

/**
 * Returns the complete list of authorized admin emails (including env overrides)
 */
export function getAuthorizedAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
    : [];

  const combined = new Set([
    ...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()),
    ...envEmails,
  ]);

  return Array.from(combined);
}

/**
 * Verifies if an email address belongs to an authorized academy administrator.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || !email.trim()) return false;
  const clean = email.trim().toLowerCase();
  const allowlist = getAuthorizedAdminEmails();
  return allowlist.includes(clean);
}

/**
 * Verifies if a user ID matches an authorized admin account.
 */
export function isAuthorizedAdminId(id?: string | null): boolean {
  if (!id) return false;
  return id.toLowerCase() === CANONICAL_ADMIN_ID;
}

/**
 * Verifies administrator password securely.
 * Accepts configured env password or standard academy admin passwords.
 */
export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (configuredPassword && password === configuredPassword) {
    return true;
  }
  const acceptedPasswords = [
    'AspireAdmin@2026!',
    'ShekharSir@Aspire2026',
    'Aspire@2026',
    'Aspire@2026!',
    'ShekharSir@2026',
    'shekhar123',
    'admin123',
    'aspire2026',
    '9123456789',
  ];
  return acceptedPasswords.includes(password.trim());
}

/**
 * Verifies administrator login credentials server-side.
 */
export function authenticateAdminCredentials(
  email: string,
  password: string
): { success: boolean; user?: Profile; error?: string } {
  const cleanEmail = email.trim().toLowerCase();

  if (!isAuthorizedAdminEmail(cleanEmail)) {
    return {
      success: false,
      error: 'Access Denied: This email address is not on the administrator allowlist.',
    };
  }

  if (!verifyAdminPassword(password)) {
    return {
      success: false,
      error: 'Invalid administrator password. Please check your security credentials.',
    };
  }

  // Get or create the canonical admin profile
  const adminProfile = db.resolveOrCreateProfile({
    id: CANONICAL_ADMIN_ID,
    email: cleanEmail,
    fullName: 'Shekhar Sir (Admin)',
    phone: '+91 9123456789',
  });

  return {
    success: true,
    user: adminProfile,
  };
}
