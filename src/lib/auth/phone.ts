/**
 * Aspire Academy Online — Phone Normalization & Validation Utility (India +91)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string; // e.g. "+919876543210"
  national: string; // e.g. "9876543210"
  formatted: string; // e.g. "+91 98765 43210"
  error?: string;
}

/**
 * Validates and normalizes Indian mobile numbers into standard E.164 (+91XXXXXXXXXX)
 * Accepts formats:
 * - 9876543210
 * - 09876543210
 * - +919876543210
 * - +91 98765 43210
 * - 919876543210
 */
export function normalizeIndianPhoneNumber(input: string): PhoneValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      e164: '',
      national: '',
      formatted: '',
      error: 'Please enter your 10-digit mobile number.',
    };
  }

  // Remove all non-digit characters except leading plus
  let cleaned = input.trim().replace(/[^\d+]/g, '');

  // Strip leading plus if present for processing
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Strip leading 0 (trunk prefix)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // If starts with country code 91 and has 12 digits total
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  // At this point, valid Indian numbers must be exactly 10 digits
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      e164: '',
      national: cleaned,
      formatted: input,
      error: 'Mobile number must be exactly 10 digits.',
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  const firstDigit = cleaned.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      isValid: false,
      e164: '',
      national: cleaned,
      formatted: input,
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9.',
    };
  }

  const e164 = `+91${cleaned}`;
  const formatted = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;

  return {
    isValid: true,
    e164,
    national: cleaned,
    formatted,
  };
}

/**
 * User-friendly error message translator for Supabase phone auth errors
 */
export function formatSupabasePhoneError(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const msg = error.message || String(error);

  if (msg.includes('SMS provider is not enabled') || msg.includes('Unsupported provider') || msg.includes('provider is not enabled')) {
    return 'SMS service is pending provider configuration in the Supabase Dashboard (Authentication > Providers > Phone). You can log in using Email & Password or Google in the meantime.';
  }

  if (msg.includes('rate limit') || msg.includes('Too many requests') || msg.includes('over_sms_send_rate_limit')) {
    return 'Too many SMS requests sent. For security, please wait 60 seconds before requesting another OTP.';
  }

  if (msg.includes('Token has expired') || msg.includes('expired')) {
    return 'The OTP has expired. Please tap "Resend OTP" to receive a new 6-digit code.';
  }

  if (msg.includes('Invalid token') || msg.includes('Token is invalid') || msg.includes('invalid_token')) {
    return 'Incorrect OTP entered. Please check the 6-digit code sent to your phone and try again.';
  }

  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return 'This mobile number is already registered. Please sign in with your password or request an OTP login.';
  }

  if (msg.includes('User not found') || msg.includes('Signups not allowed')) {
    return 'No account was found with this mobile number. Please click "Register here" to create your account.';
  }

  return msg;
}
