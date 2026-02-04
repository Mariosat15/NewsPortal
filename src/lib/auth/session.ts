import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const SESSION_COOKIE_NAME = 'news_session';
const MSISDN_COOKIE_NAME = 'user_msisdn';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export interface UserSession {
  sessionId: string;
  msisdn: string | null;
  createdAt: Date;
}

// Get or create a session for the user
export async function getOrCreateSession(): Promise<UserSession> {
  const cookieStore = await cookies();
  
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const msisdn = cookieStore.get(MSISDN_COOKIE_NAME)?.value || null;

  if (!sessionId) {
    sessionId = uuidv4();
  }

  return {
    sessionId,
    msisdn,
    createdAt: new Date(),
  };
}

// Set session cookie (called from API routes)
export function setSessionCookie(sessionId: string): void {
  // This is called from API routes where we have direct access to response
  // The actual setting happens in the API route
}

// Set MSISDN cookie (called after successful payment)
export function setMsisdnCookie(msisdn: string): void {
  // This is called from API routes where we have direct access to response
  // The actual setting happens in the API route
}

// Get session ID from request headers/cookies
export async function getSessionId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

// Get MSISDN from request headers/cookies
export async function getMsisdn(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(MSISDN_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

// Check if user is identified (has MSISDN)
export async function isUserIdentified(): Promise<boolean> {
  const msisdn = await getMsisdn();
  return msisdn !== null && msisdn.length > 0;
}

// Cookie configuration for API responses
export const sessionCookieConfig = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_MAX_AGE,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const msisdnCookieConfig = {
  name: MSISDN_COOKIE_NAME,
  maxAge: SESSION_MAX_AGE,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
