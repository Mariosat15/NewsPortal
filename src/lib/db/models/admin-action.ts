import { ObjectId } from 'mongodb';

export type AdminActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'import'
  | 'export'
  | 'publish'
  | 'unpublish'
  | 'login'
  | 'logout'
  | 'settings_change'
  | 'refund'
  | 'agent_run'
  | 'bulk_action';

export type AdminResourceType =
  | 'article'
  | 'landing_page'
  | 'legal_page'
  | 'category'
  | 'template'
  | 'user'
  | 'customer'
  | 'transaction'
  | 'billing'
  | 'settings'
  | 'agent'
  | 'image_source'
  | 'webhook';

export interface AdminAction {
  _id?: ObjectId;
  tenantId: string;
  adminUser: string;        // Who performed the action
  action: AdminActionType;
  resource: AdminResourceType;
  resourceId?: string;       // ID of the affected resource
  resourceName?: string;     // Human-readable name (e.g., article title)
  details?: string;          // Short description of what changed
  metadata?: Record<string, unknown>; // Before/after snapshot or extra context
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AdminActionCreateInput {
  tenantId: string;
  adminUser: string;
  action: AdminActionType;
  resource: AdminResourceType;
  resourceId?: string;
  resourceName?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}
