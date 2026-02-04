import { ObjectId } from 'mongodb';

export interface UserVisit {
  timestamp: Date;
  ip: string;
  userAgent: string;
  device: string;
  os: string;
  browser: string;
  referrer: string;
  page: string;
  sessionId: string;
}

export interface User {
  _id?: ObjectId;
  msisdn: string;
  normalizedMsisdn: string;
  firstSeen: Date;
  lastSeen: Date;
  visits: UserVisit[];
  totalVisits: number;
  bookmarks: string[]; // Article IDs
  favorites: string[]; // Article IDs
}

export interface UserCreateInput {
  msisdn: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  page?: string;
  sessionId?: string;
}

// Normalize MSISDN to standard format
export function normalizeMSISDN(msisdn: string): string {
  let cleaned = msisdn.replace(/\D/g, '');
  // Convert German local format to international
  if (cleaned.startsWith('0')) {
    cleaned = '49' + cleaned.substring(1);
  }
  // Ensure it starts with country code
  if (!cleaned.startsWith('49') && cleaned.length <= 12) {
    cleaned = '49' + cleaned;
  }
  return cleaned;
}

// Parse user agent string
export function parseUserAgent(userAgent: string): { device: string; os: string; browser: string } {
  let device = 'Unknown';
  let os = 'Unknown';
  let browser = 'Unknown';

  // Detect device
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/Tablet|iPad/i.test(userAgent)) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  // Detect OS
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac OS/i.test(userAgent)) os = 'macOS';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(userAgent)) os = 'iOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  // Detect browser
  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browser = 'Chrome';
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';
  else if (/Opera|OPR/i.test(userAgent)) browser = 'Opera';

  return { device, os, browser };
}

// Create a new user record
export function createUser(input: UserCreateInput): Omit<User, '_id'> {
  const now = new Date();
  const normalizedMsisdn = normalizeMSISDN(input.msisdn);
  const { device, os, browser } = parseUserAgent(input.userAgent || '');

  const initialVisit: UserVisit = {
    timestamp: now,
    ip: input.ip || '',
    userAgent: input.userAgent || '',
    device,
    os,
    browser,
    referrer: input.referrer || '',
    page: input.page || '/',
    sessionId: input.sessionId || '',
  };

  return {
    msisdn: input.msisdn,
    normalizedMsisdn,
    firstSeen: now,
    lastSeen: now,
    visits: [initialVisit],
    totalVisits: 1,
    bookmarks: [],
    favorites: [],
  };
}

// Create a visit record
export function createVisit(
  ip: string,
  userAgent: string,
  referrer: string,
  page: string,
  sessionId: string
): UserVisit {
  const { device, os, browser } = parseUserAgent(userAgent);
  return {
    timestamp: new Date(),
    ip,
    userAgent,
    device,
    os,
    browser,
    referrer,
    page,
    sessionId,
  };
}
