import { ObjectId } from 'mongodb';

export type BillingStatus = 'paid' | 'refunded' | 'pending' | 'failed';

export interface BillingImport {
  _id?: ObjectId;
  msisdn: string;
  normalizedMsisdn: string;
  transactionId: string;
  amount: number; // in cents
  currency: string;
  status: BillingStatus;
  quantity: number; // Number of articles this payment covers
  originalDate: Date; // Date from the billing record
  importedAt: Date;
  importBatchId: string; // To track which CSV import batch this came from
  rawData?: Record<string, unknown>; // Original CSV row data
  processed: boolean; // Whether this has been converted to unlocks
  processedAt?: Date;
}

export interface BillingImportCreateInput {
  msisdn: string;
  transactionId: string;
  amount: number;
  currency?: string;
  status: BillingStatus;
  quantity?: number;
  originalDate: Date | string;
  importBatchId: string;
  rawData?: Record<string, unknown>;
}

// Normalize MSISDN
function normalizeMSISDN(msisdn: string): string {
  let cleaned = msisdn.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '49' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('49') && cleaned.length <= 12) {
    cleaned = '49' + cleaned;
  }
  return cleaned;
}

// Create a billing import record
export function createBillingImport(input: BillingImportCreateInput): Omit<BillingImport, '_id'> {
  const now = new Date();
  const originalDate = typeof input.originalDate === 'string' 
    ? new Date(input.originalDate) 
    : input.originalDate;

  return {
    msisdn: input.msisdn,
    normalizedMsisdn: normalizeMSISDN(input.msisdn),
    transactionId: input.transactionId,
    amount: input.amount,
    currency: input.currency || 'EUR',
    status: input.status,
    quantity: input.quantity || Math.floor(input.amount / 99), // Default: 99 cents per article
    originalDate,
    importedAt: now,
    importBatchId: input.importBatchId,
    rawData: input.rawData,
    processed: false,
  };
}

// Parse CSV row to billing import input
export function parseCSVRow(
  row: Record<string, string>,
  importBatchId: string,
  columnMapping?: {
    msisdn?: string;
    transactionId?: string;
    amount?: string;
    status?: string;
    date?: string;
  }
): BillingImportCreateInput | null {
  const mapping = {
    msisdn: columnMapping?.msisdn || 'msisdn',
    transactionId: columnMapping?.transactionId || 'transaction_id',
    amount: columnMapping?.amount || 'amount',
    status: columnMapping?.status || 'status',
    date: columnMapping?.date || 'date',
  };

  const msisdn = row[mapping.msisdn];
  const transactionId = row[mapping.transactionId];
  const amountStr = row[mapping.amount];
  const statusStr = row[mapping.status];
  const dateStr = row[mapping.date];

  if (!msisdn || !transactionId || !amountStr) {
    return null;
  }

  // Parse amount (handle both cents and euros)
  let amount = parseFloat(amountStr.replace(',', '.').replace(/[^\d.-]/g, ''));
  if (amount < 100) {
    // Assume it's in euros, convert to cents
    amount = Math.round(amount * 100);
  }

  // Parse status
  let status: BillingStatus = 'paid';
  if (statusStr) {
    const normalizedStatus = statusStr.toLowerCase();
    if (normalizedStatus.includes('refund')) status = 'refunded';
    else if (normalizedStatus.includes('fail')) status = 'failed';
    else if (normalizedStatus.includes('pend')) status = 'pending';
  }

  // Parse date
  let originalDate: Date;
  try {
    originalDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(originalDate.getTime())) {
      originalDate = new Date();
    }
  } catch {
    originalDate = new Date();
  }

  return {
    msisdn,
    transactionId,
    amount,
    status,
    originalDate,
    importBatchId,
    rawData: row,
  };
}
