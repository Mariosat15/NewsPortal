import { generateTransactionId } from '@/lib/utils';

export interface DimocoConfig {
  apiUrl: string;
  apiKey: string;
  merchantId: string;
  serviceId: string;
  callbackSecret: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentInitRequest {
  articleId: string;
  articleSlug: string;
  amount: number; // in cents
  currency: string;
  description: string;
  returnUrl: string;
  brandId: string;
}

export interface PaymentInitResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  error?: string;
}

export interface PaymentCallbackData {
  transactionId: string;
  status: 'success' | 'failed' | 'cancelled';
  msisdn?: string;
  amount?: number;
  currency?: string;
  timestamp?: string;
  signature?: string;
}

// Get DIMOCO configuration from environment
export function getDimocoConfig(): DimocoConfig {
  return {
    apiUrl: process.env.DIMOCO_API_URL || 'https://api.dimoco.eu',
    apiKey: process.env.DIMOCO_API_KEY || '',
    merchantId: process.env.DIMOCO_MERCHANT_ID || '',
    serviceId: process.env.DIMOCO_SERVICE_ID || '',
    callbackSecret: process.env.DIMOCO_CALLBACK_SECRET || '',
    successUrl: process.env.DIMOCO_SUCCESS_URL || 'http://localhost:3000/payment/success',
    cancelUrl: process.env.DIMOCO_CANCEL_URL || 'http://localhost:3000/payment/cancel',
  };
}

// Initiate a DIMOCO payment
export async function initiatePayment(request: PaymentInitRequest): Promise<PaymentInitResponse> {
  const config = getDimocoConfig();
  const transactionId = generateTransactionId();

  // In a real implementation, this would call the DIMOCO API
  // For now, we'll create a mock payment URL that simulates the flow
  
  // Build the payment URL with parameters
  const params = new URLSearchParams({
    merchantId: config.merchantId,
    serviceId: config.serviceId,
    transactionId,
    amount: request.amount.toString(),
    currency: request.currency,
    description: request.description,
    successUrl: `${config.successUrl}?transactionId=${transactionId}&articleId=${request.articleId}`,
    cancelUrl: `${config.cancelUrl}?transactionId=${transactionId}`,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/dimoco/callback`,
  });

  // In production, this would be the actual DIMOCO payment page URL
  // For development/demo, we'll use a mock payment page
  const paymentUrl = `/api/payment/dimoco/mock?${params.toString()}`;

  return {
    success: true,
    transactionId,
    paymentUrl,
  };
}

// Verify callback signature (HMAC)
export function verifyCallbackSignature(data: PaymentCallbackData, receivedSignature: string): boolean {
  const config = getDimocoConfig();
  
  if (!config.callbackSecret) {
    console.warn('DIMOCO callback secret not configured');
    return true; // Skip verification in development
  }

  // In production, implement proper HMAC verification
  // This is a placeholder for the actual signature verification
  const crypto = require('crypto');
  const payload = `${data.transactionId}|${data.status}|${data.msisdn || ''}|${data.amount || ''}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.callbackSecret)
    .update(payload)
    .digest('hex');

  return receivedSignature === expectedSignature;
}

// Parse amount from DIMOCO format (might be in different formats)
export function parseAmount(amount: string | number): number {
  if (typeof amount === 'number') return amount;
  
  // Remove currency symbols and convert to cents
  const cleaned = amount.replace(/[^\d.,]/g, '');
  const parsed = parseFloat(cleaned.replace(',', '.'));
  
  // If less than 100, assume it's in euros and convert to cents
  if (parsed < 100) {
    return Math.round(parsed * 100);
  }
  
  return Math.round(parsed);
}
