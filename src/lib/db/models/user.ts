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

export type AuthProvider = 'email' | 'msisdn';
export type MsisdnSource = 'header_enrichment' | 'dimoco_identify' | 'payment' | 'manual' | 'billing_import';
export type UserStatus = 'visitor' | 'identified' | 'customer';

export interface User {
  _id?: ObjectId;
  // Email authentication fields
  email?: string;
  passwordHash?: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  
  // MSISDN authentication fields (for mobile payment identification)
  msisdn?: string;
  normalizedMsisdn?: string;
  msisdnSource?: MsisdnSource;      // How we detected the MSISDN
  msisdnConfirmedAt?: Date;          // When MSISDN was confirmed via payment
  
  // Auth provider tracking
  authProvider: AuthProvider;
  
  // User status (visitor → identified → customer)
  status: UserStatus;
  
  // Landing page tracking
  firstLandingPage?: string;         // Slug of first landing page
  lastLandingPage?: string;          // Slug of most recent landing page
  landingPageVisits: LandingPageVisit[];
  
  // Conversion tracking
  firstPurchaseAt?: Date;
  lastPurchaseAt?: Date;
  totalPurchases: number;
  totalSpent: number;                // In cents
  
  // Timestamps and tracking
  firstSeen: Date;
  lastSeen: Date;
  visits: UserVisit[];
  totalVisits: number;
  
  // User preferences
  bookmarks: string[]; // Article IDs
  favorites: string[]; // Article IDs
  
  // Carrier info
  carrier?: string;
  country?: string;
  
  // Account status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingPageVisit {
  landingPageSlug: string;
  landingPageId?: string;
  timestamp: Date;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

export interface UserCreateInput {
  // For email registration
  email?: string;
  passwordHash?: string;
  name?: string;
  
  // For MSISDN identification
  msisdn?: string;
  
  // Tracking
  ip?: string;
  userAgent?: string;
  referrer?: string;
  page?: string;
  sessionId?: string;
}

export interface EmailUserCreateInput {
  email: string;
  passwordHash: string;
  name: string;
  ip?: string;
  userAgent?: string;
}

export interface MSISDNUserCreateInput {
  msisdn: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  page?: string;
  sessionId?: string;
  msisdnSource?: MsisdnSource;
  landingPageSlug?: string;
  landingPageId?: string;
  carrier?: string;
  country?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

// Normalize MSISDN to standard format - supports international numbers
export function normalizeMSISDN(msisdn: string): string {
  if (!msisdn) return '';
  let cleaned = msisdn.replace(/\D/g, '');
  // Convert German local format (0xxx) to international
  if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = '49' + cleaned.substring(1);
  }
  // Handle 00 prefix (international dialing)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
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

// Create a new email-based user record
export function createEmailUser(input: EmailUserCreateInput): Omit<User, '_id'> {
  const now = new Date();
  const { device, os, browser } = parseUserAgent(input.userAgent || '');

  const initialVisit: UserVisit = {
    timestamp: now,
    ip: input.ip || '',
    userAgent: input.userAgent || '',
    device,
    os,
    browser,
    referrer: '',
    page: '/register',
    sessionId: '',
  };

  return {
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    name: input.name,
    emailVerified: false,
    authProvider: 'email',
    status: 'visitor',
    landingPageVisits: [],
    totalPurchases: 0,
    totalSpent: 0,
    firstSeen: now,
    lastSeen: now,
    visits: [initialVisit],
    totalVisits: 1,
    bookmarks: [],
    favorites: [],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

// Create a new MSISDN-based user record
export function createMSISDNUser(input: MSISDNUserCreateInput): Omit<User, '_id'> {
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

  const landingPageVisits: LandingPageVisit[] = [];
  if (input.landingPageSlug) {
    landingPageVisits.push({
      landingPageSlug: input.landingPageSlug,
      landingPageId: input.landingPageId,
      timestamp: now,
      utm: input.utm,
    });
  }

  return {
    msisdn: input.msisdn,
    normalizedMsisdn,
    msisdnSource: input.msisdnSource || 'dimoco_identify',
    emailVerified: false,
    authProvider: 'msisdn',
    status: 'identified',
    firstLandingPage: input.landingPageSlug,
    lastLandingPage: input.landingPageSlug,
    landingPageVisits,
    totalPurchases: 0,
    totalSpent: 0,
    firstSeen: now,
    lastSeen: now,
    visits: [initialVisit],
    totalVisits: 1,
    bookmarks: [],
    favorites: [],
    carrier: input.carrier,
    country: input.country,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

// Legacy function for backward compatibility
export function createUser(input: UserCreateInput): Omit<User, '_id'> {
  if (input.email && input.passwordHash) {
    return createEmailUser({
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name || '',
      ip: input.ip,
      userAgent: input.userAgent,
    });
  } else if (input.msisdn) {
    return createMSISDNUser({
      msisdn: input.msisdn,
      ip: input.ip,
      userAgent: input.userAgent,
      referrer: input.referrer,
      page: input.page,
      sessionId: input.sessionId,
    });
  }
  
  throw new Error('Either email+passwordHash or msisdn must be provided');
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

// Safe user object for client-side (without sensitive data)
export interface SafeUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  authProvider: AuthProvider;
  emailVerified: boolean;
  createdAt: string;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user._id?.toString() || '',
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    authProvider: user.authProvider,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
  };
}
