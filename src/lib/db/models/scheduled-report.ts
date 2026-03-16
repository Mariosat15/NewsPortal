import { ObjectId } from 'mongodb';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';
export type ReportType = 'revenue' | 'traffic' | 'campaigns' | 'full';

export interface ScheduledReport {
  _id?: ObjectId;
  tenantId: string;
  name: string;
  type: ReportType;
  frequency: ReportFrequency;
  recipientEmails: string[];
  active: boolean;
  lastSentAt?: Date;
  nextRunAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
