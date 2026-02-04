export interface CustomerSession {
  sessionId: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  landingPageSlug?: string;
  campaign?: string;
  source?: string;
}

export interface Customer {
  _id: string; // normalizedMsisdn as primary key
  msisdn: string; // Original format
  tenantId: string;
  // User account link (if customer registered/logged in during purchase)
  userId?: string;
  userEmail?: string;
  userName?: string;
  // Timestamps
  firstSeenAt: Date;
  lastSeenAt: Date;
  totalVisits: number;
  visitsLast30d: number;
  heavyUserFlag: boolean;
  topCampaign?: string;
  topSource?: string;
  sessions: CustomerSession[];
  // Billing
  totalBillingAmount: number; // In cents
  totalPurchases: number; // Count of purchases
  lastBillingDate?: Date;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerCreateInput {
  msisdn: string;
  normalizedMsisdn: string;
  tenantId: string;
  // User account link
  userId?: string;
  userEmail?: string;
  userName?: string;
  // Session info
  sessionId?: string;
  landingPageSlug?: string;
  campaign?: string;
  source?: string;
}

export interface CustomerUpdateInput {
  lastSeenAt?: Date;
  totalVisits?: number;
  visitsLast30d?: number;
  heavyUserFlag?: boolean;
  topCampaign?: string;
  topSource?: string;
  totalBillingAmount?: number;
  totalPurchases?: number;
  lastBillingDate?: Date;
  // User account link
  userId?: string;
  userEmail?: string;
  userName?: string;
  notes?: string;
  tags?: string[];
}

export interface CustomerSearchParams {
  msisdn?: string; // Partial match
  tenantId?: string;
  heavyUserOnly?: boolean;
  minVisits?: number;
  dateFrom?: Date;
  dateTo?: Date;
  campaign?: string;
  source?: string;
  page?: number;
  limit?: number;
}

export interface CustomerExportParams {
  tenantId?: string;
  dateFrom: Date;
  dateTo: Date;
  minVisits: number;
  campaign?: string;
  source?: string;
}
