import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale: string = 'de-DE'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatPrice(cents: number, locale: string = 'de-DE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${randomPart}`.toUpperCase();
}

export function isValidMSISDN(msisdn: string): boolean {
  // German phone number validation (with or without country code)
  const cleaned = msisdn.replace(/\D/g, '');
  // German numbers: 49XXXXXXXXXX or 0XXXXXXXXXX
  return /^(49|0)?[1-9]\d{9,13}$/.test(cleaned);
}

export function normalizeMSISDN(msisdn: string): string {
  if (!msisdn) return '';
  
  let cleaned = msisdn.replace(/\D/g, '');
  
  // Convert German local format (0xxx) to international (49xxx)
  if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = '49' + cleaned.substring(1);
  }
  
  // Handle 00 prefix (international dialing)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  
  // DON'T force 49 prefix - allow international numbers
  // Valid international numbers should already have country codes
  return cleaned;
}

export function maskMSISDN(msisdn: string): string {
  const normalized = normalizeMSISDN(msisdn);
  if (normalized.length < 8) return normalized;
  return normalized.slice(0, 5) + '****' + normalized.slice(-3);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}
