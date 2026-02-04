import { ObjectId } from 'mongodb';

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  model?: string;
  vendor?: string;
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  adgroup?: string;
  creative?: string;
  content?: string;
  term?: string;
}

export type MsisdnConfidence = 'CONFIRMED' | 'UNCONFIRMED' | 'NONE';
export type NetworkType = 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN';

export interface VisitorSession {
  _id?: ObjectId;
  sessionId: string;
  tenantId: string;
  landingPageId?: ObjectId;
  landingPageSlug?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  ip: string;
  userAgent: string;
  device: DeviceInfo;
  referrer?: string;
  utm: UtmParams;
  msisdn?: string;
  normalizedMsisdn?: string;
  msisdnConfidence: MsisdnConfidence;
  networkType: NetworkType;
  carrier?: string;
  carrierCode?: string;
  pageViews: number;
  events: number;
  enteredPortal: boolean;
  lastPageUrl?: string;
  purchaseCompleted?: boolean;
}

export interface VisitorSessionCreateInput {
  sessionId: string;
  tenantId: string;
  landingPageId?: ObjectId;
  landingPageSlug?: string;
  ip: string;
  userAgent: string;
  device: DeviceInfo;
  referrer?: string;
  utm?: UtmParams;
}

export interface VisitorSessionUpdateInput {
  lastSeenAt?: Date;
  msisdn?: string;
  normalizedMsisdn?: string;
  msisdnConfidence?: MsisdnConfidence;
  networkType?: NetworkType;
  carrier?: string;
  carrierCode?: string;
  pageViews?: number;
  events?: number;
  enteredPortal?: boolean;
  lastPageUrl?: string;
  purchaseCompleted?: boolean;
}
