import { ObjectId } from 'mongodb';

export type WebhookEventType =
  | 'purchase.completed'
  | 'subscriber.new'
  | 'article.published'
  | 'visitor.msisdn_detected';

export interface Webhook {
  _id?: ObjectId;
  tenantId: string;
  name: string;
  url: string;
  secret?: string; // HMAC secret for signature verification
  events: WebhookEventType[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  failCount: number; // consecutive failures
}

export interface WebhookLog {
  _id?: ObjectId;
  tenantId: string;
  webhookId: ObjectId;
  event: WebhookEventType;
  payload: Record<string, unknown>;
  statusCode?: number;
  responseBody?: string;
  success: boolean;
  error?: string;
  timestamp: Date;
  durationMs: number;
}
