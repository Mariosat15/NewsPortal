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
  firstSeenAt: Date;
  lastSeenAt: Date;
  totalVisits: number;
  visitsLast30d: number;
  heavyUserFlag: boolean;
  topCampaign?: string;
  topSource?: string;
  sessions: CustomerSession[];
  totalBillingAmount: number; // In cents
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
  lastBillingDate?: Date;
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
