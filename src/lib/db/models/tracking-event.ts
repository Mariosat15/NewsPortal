import { ObjectId } from 'mongodb';

export type TrackingEventType =
  | 'page_view'
  | 'scroll_depth'
  | 'click_banner'
  | 'click_cta'
  | 'click_link'
  | 'click_image'
  | 'enter_portal'
  | 'article_view'
  | 'article_purchase'
  | 'video_play'
  | 'video_complete'
  | 'form_submit'
  | 'session_start'
  | 'session_end';

export interface TrackingEventMetadata {
  landingPageId?: ObjectId;
  landingPageSlug?: string;
  bannerId?: string;
  bannerPosition?: string;
  ctaId?: string;
  targetUrl?: string;
  scrollPercent?: number;
  articleSlug?: string;
  articleId?: string;
  articleTitle?: string;
  videoUrl?: string;
  videoDuration?: number;
  formId?: string;
  pageUrl?: string;
  pageTitle?: string;
  elementId?: string;
  elementText?: string;
  [key: string]: unknown;
}

export interface TrackingEvent {
  _id?: ObjectId;
  sessionId: string;
  tenantId: string;
  msisdn?: string;
  normalizedMsisdn?: string;
  type: TrackingEventType;
  metadata: TrackingEventMetadata;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

export interface TrackingEventCreateInput {
  sessionId: string;
  tenantId: string;
  msisdn?: string;
  normalizedMsisdn?: string;
  type: TrackingEventType;
  metadata?: TrackingEventMetadata;
  ip?: string;
  userAgent?: string;
}
