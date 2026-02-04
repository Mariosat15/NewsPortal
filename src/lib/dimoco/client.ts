import { generateTransactionId } from '@/lib/utils';

// ===========================================
// DIMOCO API Configuration
// ===========================================

export interface DimocoConfig {
  apiUrl: string;
  merchantId: string;
  password: string;
  orderId: string;
  useSandbox: boolean;
}

export interface PaymentInitRequest {
  articleId: string;
  articleSlug: string;
  amount: number; // in cents
  currency: string;
  description: string;
  returnUrl: string;
  brandId: string;
  baseUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  redirectUrl?: string;
  msisdn?: string;
  error?: string;
}

export interface IdentifyResponse {
  success: boolean;
  msisdn?: string;
  operator?: string;
  error?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number; // in cents
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
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
  const apiUrl = process.env.DIMOCO_API_URL || 'https://sandbox-dcb.dimoco.at/sph/payment';
  const useSandbox = apiUrl.includes('sandbox');
  
  return {
    apiUrl,
    merchantId: process.env.DIMOCO_MERCHANT_ID || '8000',
    password: process.env.DIMOCO_PASSWORD || '',
    orderId: process.env.DIMOCO_ORDER_ID || '8000',
    useSandbox,
  };
}

// ===========================================
// DIMOCO API Actions
// ===========================================

/**
 * Identify - Detect user's MSISDN via carrier header enrichment
 * In sandbox: Always returns MSISDN 436763602302 and operator AT_SANDBOX
 */
export async function identifyUser(baseUrl: string): Promise<IdentifyResponse> {
  const config = getDimocoConfig();
  
  try {
    console.log('[DIMOCO] Calling identify action...');
    
    const params = new URLSearchParams({
      action: 'identify',
      merchant: config.merchantId,
      password: config.password,
      order: config.orderId,
      returnurl: `${baseUrl}/api/payment/dimoco/identify-callback`,
    });

    const response = await fetch(`${config.apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/x-www-form-urlencoded',
      },
    });

    const text = await response.text();
    console.log('[DIMOCO] Identify response:', text);

    // Parse DIMOCO response (format: key=value&key=value)
    const result = parseResponse(text);
    
    if (result.status === 'OK' || result.status === 'ok') {
      return {
        success: true,
        msisdn: result.msisdn || result.MSISDN,
        operator: result.operator || result.OPERATOR,
      };
    }

    return {
      success: false,
      error: result.errormessage || result.error || 'Identification failed',
    };
  } catch (error) {
    console.error('[DIMOCO] Identify error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Start - Initiate a payment transaction
 * Requires redirect=1 in sandbox mode
 */
export async function startPayment(
  request: PaymentInitRequest
): Promise<PaymentInitResponse> {
  const config = getDimocoConfig();
  const transactionId = generateTransactionId();
  const baseUrl = request.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Store metadata for later retrieval in callback
  const callbackUrl = `${baseUrl}/api/payment/dimoco/callback`;
  const successUrl = request.returnUrl || `${baseUrl}/de/article/${request.articleSlug}`;
  const errorUrl = `${baseUrl}/payment/error?transactionId=${transactionId}`;

  try {
    console.log('[DIMOCO] Starting payment...', {
      transactionId,
      amount: request.amount,
      articleId: request.articleId,
    });

    // Build DIMOCO start request
    const params = new URLSearchParams({
      action: 'start',
      merchant: config.merchantId,
      password: config.password,
      order: config.orderId,
      tid: transactionId,
      amount: (request.amount / 100).toFixed(2), // DIMOCO expects amount in EUR, not cents
      currency: request.currency || 'EUR',
      description: request.description.substring(0, 50), // Max 50 chars
      returnurl: successUrl,
      errorurl: errorUrl,
      callbackurl: callbackUrl,
      // Sandbox requires redirect=1
      redirect: '1',
      // Custom data to pass through
      custom1: request.articleId,
      custom2: request.brandId,
      custom3: request.metadata ? encodeURIComponent(JSON.stringify(request.metadata)) : '',
    });

    console.log('[DIMOCO] Request URL:', `${config.apiUrl}?action=start&...`);

    const response = await fetch(`${config.apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/x-www-form-urlencoded',
      },
    });

    const text = await response.text();
    console.log('[DIMOCO] Start response:', text);

    // Parse response
    const result = parseResponse(text);

    if (result.status === 'OK' || result.status === 'ok') {
      // DIMOCO returns a redirect URL for payment page
      const redirectUrl = result.redirect_url || result.redirecturl || result.url;
      
      return {
        success: true,
        transactionId,
        redirectUrl,
        paymentUrl: redirectUrl,
        msisdn: result.msisdn,
      };
    }

    // Check if we got a redirect URL even without OK status
    if (result.redirect_url || result.redirecturl || result.url) {
      return {
        success: true,
        transactionId,
        redirectUrl: result.redirect_url || result.redirecturl || result.url,
        paymentUrl: result.redirect_url || result.redirecturl || result.url,
      };
    }

    return {
      success: false,
      transactionId,
      error: result.errormessage || result.error || 'Payment initiation failed',
    };
  } catch (error) {
    console.error('[DIMOCO] Start error:', error);
    return {
      success: false,
      transactionId,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Refund - Process a refund for a completed transaction
 */
export async function refundPayment(request: RefundRequest): Promise<RefundResponse> {
  const config = getDimocoConfig();

  try {
    console.log('[DIMOCO] Processing refund...', {
      transactionId: request.transactionId,
      amount: request.amount,
    });

    const params = new URLSearchParams({
      action: 'refund',
      merchant: config.merchantId,
      password: config.password,
      order: config.orderId,
      tid: request.transactionId,
      amount: (request.amount / 100).toFixed(2), // DIMOCO expects amount in EUR
      reason: request.reason || 'Customer refund',
    });

    const response = await fetch(`${config.apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/x-www-form-urlencoded',
      },
    });

    const text = await response.text();
    console.log('[DIMOCO] Refund response:', text);

    const result = parseResponse(text);

    if (result.status === 'OK' || result.status === 'ok') {
      return {
        success: true,
        refundId: result.refund_id || result.refundid || request.transactionId,
      };
    }

    return {
      success: false,
      error: result.errormessage || result.error || 'Refund failed',
    };
  } catch (error) {
    console.error('[DIMOCO] Refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Parse DIMOCO response (URL-encoded format)
 */
function parseResponse(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Handle JSON response
  if (text.startsWith('{')) {
    try {
      return JSON.parse(text);
    } catch {
      // Not JSON, continue with URL encoding
    }
  }
  
  // Handle URL-encoded response
  const pairs = text.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      result[key.toLowerCase()] = decodeURIComponent(value || '');
    }
  }
  
  return result;
}

/**
 * Verify callback signature (HMAC) - for production security
 */
export function verifyCallbackSignature(data: PaymentCallbackData, receivedSignature: string): boolean {
  const config = getDimocoConfig();
  
  // In sandbox, skip verification
  if (config.useSandbox) {
    console.log('[DIMOCO] Sandbox mode - skipping signature verification');
    return true;
  }

  // Production signature verification would go here
  // This depends on DIMOCO's specific signing method
  console.warn('[DIMOCO] Signature verification not implemented for production');
  return true;
}

/**
 * Parse amount from DIMOCO format
 */
export function parseAmount(amount: string | number): number {
  if (typeof amount === 'number') return Math.round(amount * 100);
  
  const cleaned = amount.replace(/[^\d.,]/g, '');
  
  // Handle European format (comma as decimal)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parsed = parseFloat(cleaned.replace(',', '.'));
    return Math.round(parsed * 100);
  }
  
  // Standard decimal format
  const parsed = parseFloat(cleaned);
  if (parsed < 100) {
    // Assume euros, convert to cents
    return Math.round(parsed * 100);
  }
  
  return Math.round(parsed);
}

// ===========================================
// Legacy Mock Support (for development without DIMOCO)
// ===========================================

export async function initiatePaymentMock(request: PaymentInitRequest): Promise<PaymentInitResponse> {
  const config = getDimocoConfig();
  const transactionId = generateTransactionId();
  const baseUrl = request.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const successUrl = request.returnUrl || `${baseUrl}/de/article/${request.articleSlug}`;

  // Build mock payment URL
  const params = new URLSearchParams({
    merchantId: config.merchantId,
    orderId: config.orderId,
    transactionId,
    amount: request.amount.toString(),
    currency: request.currency,
    description: request.description,
    successUrl: successUrl,
    cancelUrl: `${baseUrl}/payment/cancel?transactionId=${transactionId}`,
    callbackUrl: `${baseUrl}/api/payment/dimoco/callback`,
    articleId: request.articleId,
  });

  if (request.metadata) {
    params.set('metadata', encodeURIComponent(JSON.stringify(request.metadata)));
  }

  return {
    success: true,
    transactionId,
    paymentUrl: `/api/payment/dimoco/mock?${params.toString()}`,
  };
}
