import { ObjectId } from 'mongodb';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Unlock {
  _id?: ObjectId;
  msisdn: string;
  normalizedMsisdn: string;
  articleId: ObjectId;
  transactionId: string;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  paymentProvider: 'dimoco' | 'import' | 'manual';
  unlockedAt: Date;
  expiresAt?: Date; // Optional expiration
  metadata?: Record<string, unknown>;
}

export interface UnlockCreateInput {
  msisdn: string;
  articleId: string | ObjectId;
  transactionId: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  paymentProvider?: 'dimoco' | 'import' | 'manual';
  metadata?: Record<string, unknown>;
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

// Create an unlock record
export function createUnlock(input: UnlockCreateInput): Omit<Unlock, '_id'> {
  return {
    msisdn: input.msisdn,
    normalizedMsisdn: normalizeMSISDN(input.msisdn),
    articleId: typeof input.articleId === 'string' ? new ObjectId(input.articleId) : input.articleId,
    transactionId: input.transactionId,
    amount: input.amount,
    currency: input.currency || 'EUR',
    status: input.status || 'completed',
    paymentProvider: input.paymentProvider || 'dimoco',
    unlockedAt: new Date(),
    metadata: input.metadata,
  };
}

// Check if a user has unlocked an article
export interface UnlockCheck {
  msisdn: string;
  articleId: string | ObjectId;
}
