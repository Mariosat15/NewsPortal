import { ObjectId } from 'mongodb';

export type ImportSource = 'DIMOCO' | 'SMS' | 'SUBSCRIPTION' | 'OTHER';
export type ImportStatus = 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImportError {
  row: number;
  data?: Record<string, unknown>;
  error: string;
  field?: string;
}

export interface ImportBatch {
  _id?: ObjectId;
  tenantId: string;
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedAt: Date;
  source: ImportSource;
  totalRows: number;
  accepted: number;
  rejected: number;
  duplicates: number;
  errors: ImportError[];
  status: ImportStatus;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  columnMapping?: Record<string, string>; // Maps file columns to our fields
  notes?: string;
}

export interface ImportBatchCreateInput {
  tenantId: string;
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  uploadedBy: string;
  source: ImportSource;
  columnMapping?: Record<string, string>;
  notes?: string;
}

export interface ImportBatchUpdateInput {
  totalRows?: number;
  accepted?: number;
  rejected?: number;
  duplicates?: number;
  errors?: ImportError[];
  status?: ImportStatus;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
}

export interface ImportBatchSearchParams {
  tenantId?: string;
  source?: ImportSource;
  status?: ImportStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}
