/**
 * Phone number utilities for MSISDN handling
 */

/**
 * Normalize a phone number to E.164 format
 * E.164 format: +[country code][subscriber number]
 * Example: +491234567890
 */
export function normalizePhoneNumber(msisdn: string): string {
  if (!msisdn) return '';

  // Remove all non-digit characters except leading +
  let cleaned = msisdn.replace(/[^\d+]/g, '');

  // If it starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // If it doesn't start with +, try to add country code
  if (!cleaned.startsWith('+')) {
    // If it starts with 0, assume it's a local number (default to Germany +49)
    if (cleaned.startsWith('0')) {
      cleaned = '+49' + cleaned.slice(1);
    } else if (cleaned.length >= 10) {
      // Assume it's already an international number without +
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(msisdn: string): string {
  if (!msisdn) return '';

  const normalized = normalizePhoneNumber(msisdn);
  
  // Simple formatting for German numbers
  if (normalized.startsWith('+49')) {
    const rest = normalized.slice(3);
    if (rest.length >= 10) {
      return `+49 ${rest.slice(0, 3)} ${rest.slice(3, 7)} ${rest.slice(7)}`;
    }
  }

  // Basic formatting for other numbers
  return normalized;
}

/**
 * Validate if a string could be a valid phone number
 */
export function isValidPhoneNumber(msisdn: string): boolean {
  if (!msisdn) return false;

  const normalized = normalizePhoneNumber(msisdn);
  
  // Must start with + and have at least 8 digits
  if (!normalized.startsWith('+')) return false;
  
  const digits = normalized.slice(1);
  if (!/^\d+$/.test(digits)) return false;
  if (digits.length < 8 || digits.length > 15) return false;

  return true;
}

/**
 * Extract country code from normalized phone number
 */
export function extractCountryCode(msisdn: string): string | null {
  const normalized = normalizePhoneNumber(msisdn);
  if (!normalized.startsWith('+')) return null;

  // Common country codes (could be expanded)
  const countryCodes = [
    { code: '49', country: 'DE' },  // Germany
    { code: '43', country: 'AT' },  // Austria
    { code: '41', country: 'CH' },  // Switzerland
    { code: '44', country: 'GB' },  // UK
    { code: '33', country: 'FR' },  // France
    { code: '39', country: 'IT' },  // Italy
    { code: '34', country: 'ES' },  // Spain
    { code: '31', country: 'NL' },  // Netherlands
    { code: '32', country: 'BE' },  // Belgium
    { code: '48', country: 'PL' },  // Poland
    { code: '1', country: 'US' },   // USA/Canada
  ];

  const digits = normalized.slice(1);

  for (const { code, country } of countryCodes) {
    if (digits.startsWith(code)) {
      return country;
    }
  }

  return null;
}

/**
 * Mask phone number for privacy (show only last 4 digits)
 */
export function maskPhoneNumber(msisdn: string): string {
  const normalized = normalizePhoneNumber(msisdn);
  if (normalized.length < 8) return normalized;
  
  const visible = normalized.slice(-4);
  const masked = '*'.repeat(normalized.length - 4);
  return masked + visible;
}

/**
 * Check if two phone numbers are the same (after normalization)
 */
export function areSamePhoneNumber(msisdn1: string, msisdn2: string): boolean {
  return normalizePhoneNumber(msisdn1) === normalizePhoneNumber(msisdn2);
}
