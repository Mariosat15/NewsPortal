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
  baseUrl?: string; // Dynamic base URL from request (for tunnels, different domains)
  metadata?: Record<string, unknown>; // Device fingerprint and other tracking data
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

  // Use dynamic base URL if provided, otherwise fall back to config/env
  const baseUrl = request.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // In a real implementation, this would call the DIMOCO API
  // For now, we'll create a mock payment URL that simulates the flow
  
  // Build the payment URL with parameters - all URLs are now dynamic
  const params = new URLSearchParams({
    merchantId: config.merchantId || 'your-merchant-id',
    serviceId: config.serviceId || 'your-service-id',
    transactionId,
    amount: request.amount.toString(),
    currency: request.currency,
    description: request.description,
    successUrl: `${baseUrl}/payment/success?transactionId=${transactionId}&articleId=${request.articleId}`,
    cancelUrl: `${baseUrl}/payment/cancel?transactionId=${transactionId}`,
    callbackUrl: `${baseUrl}/api/payment/dimoco/callback`,
  });
  
  // Add device metadata if provided (will be passed through to callback)
  if (request.metadata) {
    params.set('metadata', encodeURIComponent(JSON.stringify(request.metadata)));
  }

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

// Parse amount from DIMOCO format
// Amount is always expected to be in CENTS (smallest currency unit)
export function parseAmount(amount: string | number): number {
  if (typeof amount === 'number') return amount;
  
  // Remove currency symbols and whitespace
  const cleaned = amount.replace(/[^\d.,]/g, '');
  
  // Handle European format (comma as decimal separator)
  // e.g., "0,99" means 0.99 euros = 99 cents
  // e.g., "99" means 99 cents
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    // This is in euros with comma (e.g., "0,99" = 99 cents)
    const parsed = parseFloat(cleaned.replace(',', '.'));
    return Math.round(parsed * 100);
  }
  
  // If it contains a decimal point and is less than 100, assume euros
  if (cleaned.includes('.') && parseFloat(cleaned) < 100) {
    return Math.round(parseFloat(cleaned) * 100);
  }
  
  // Otherwise, assume it's already in cents
  return Math.round(parseFloat(cleaned) || 0);
}
