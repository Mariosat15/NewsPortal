import { ObjectId } from 'mongodb';

export type BillingSource = 
  | 'DIMOCO_EXPORT' 
  | 'PORTAL_PURCHASE' 
  | 'SMS_BILLING' 
  | 'SUBSCRIPTION'
  | 'OTHER';

export type BillingStatus = 
  | 'pending'
  | 'billed' 
  | 'completed'
  | 'refunded' 
  | 'chargeback' 
  | 'failed'
  | 'cancelled';

export interface BillingEvent {
  _id?: ObjectId;
  billingEventId: string; // Unique: from file or generated hash
  msisdn: string;
  normalizedMsisdn: string;
  tenantId: string;
  source: BillingSource;
  amount: number; // In cents
  currency: string;
  productCode?: string;
  serviceName?: string;
  description?: string;
  eventTime: Date;
  status: BillingStatus;
  rawRowJson?: Record<string, unknown>; // Original row for audit
  importBatchId?: ObjectId;
  sessionId?: string; // Link to visitor session if available
  articleId?: string; // For portal purchases
  articleSlug?: string;
  transactionId?: string; // External transaction ID
  createdAt: Date;
}

export interface BillingEventCreateInput {
  billingEventId?: string; // Will be generated if not provided
  msisdn: string;
  normalizedMsisdn?: string;
  tenantId: string;
  source: BillingSource;
  amount: number;
  currency?: string;
  productCode?: string;
  serviceName?: string;
  description?: string;
  eventTime?: Date;
  status?: BillingStatus;
  rawRowJson?: Record<string, unknown>;
  importBatchId?: ObjectId;
  sessionId?: string;
  articleId?: string;
  articleSlug?: string;
  transactionId?: string;
}

export interface BillingEventSearchParams {
  msisdn?: string;
  normalizedMsisdn?: string;
  tenantId?: string;
  source?: BillingSource;
  status?: BillingStatus;
  dateFrom?: Date;
  dateTo?: Date;
  importBatchId?: ObjectId;
  page?: number;
  limit?: number;
}
