import { generateTransactionId } from '@/lib/utils';
import crypto from 'crypto';

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

/**
 * Calculate DIMOCO digest (HMAC-SHA256)
 * The payload is constructed by concatenation of all unencoded parameter values
 * in alphabetical order of the parameter names.
 */
function calculateDigest(params: Record<string, string>, password: string): string {
  // Sort parameters alphabetically by key
  const sortedKeys = Object.keys(params).sort();
  
  // Concatenate values in alphabetical order of keys
  const payload = sortedKeys.map(key => params[key]).join('');
  
  // Calculate HMAC-SHA256
  const hmac = crypto.createHmac('sha256', password);
  hmac.update(payload, 'utf8');
  return hmac.digest('hex');
}

/**
 * Generate a unique request ID (UUID v4 style)
 */
function generateRequestId(): string {
  return crypto.randomUUID();
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
  redirectUrl?: string;
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

// DIMOCO API URLs (per pay:smart specification v2.1, Section 4.3)
// Server to server: https://services.dimoco.at/smart/payment
// Enduser transport: https://services.dimoco.at/smart/userpayment
// Sandbox uses a different hostname: sandbox-dcb.dimoco.at
const DIMOCO_SANDBOX_URL = 'https://sandbox-dcb.dimoco.at/sph/payment';
const DIMOCO_PRODUCTION_URL = 'https://services.dimoco.at/smart/payment';

// Get DIMOCO configuration from environment
export function getDimocoConfig(): DimocoConfig {
  const apiUrl = process.env.DIMOCO_API_URL || DIMOCO_SANDBOX_URL;
  // Detect sandbox by checking for 'sandbox' in the URL
  // Production URL: services.dimoco.at/smart/payment
  // Sandbox URL: sandbox-dcb.dimoco.at/sph/payment
  const useSandbox = apiUrl.includes('sandbox');
  
  return {
    apiUrl,
    merchantId: process.env.DIMOCO_MERCHANT_ID || '8000',
    password: process.env.DIMOCO_PASSWORD || '',
    orderId: process.env.DIMOCO_ORDER_ID || '8000',
    useSandbox,
  };
}

/**
 * Check if DIMOCO is properly configured with real credentials
 */
export function isDimocoConfigured(): boolean {
  const config = getDimocoConfig();
  return !!(config.merchantId && config.password && config.orderId);
}

// ===========================================
// DIMOCO API Actions
// ===========================================

/**
 * Identify - Detect user's MSISDN via DIMOCO's header enrichment
 * 
 * DIMOCO API Requirements:
 * - Must use POST request
 * - Must include digest (HMAC-SHA256)
 * - Must include request_id
 * - Parameter name: url_return, url_callback (not returnurl)
 * 
 * In sandbox: Always returns MSISDN 436763602302 and operator AT_SANDBOX
 */
export async function identifyUser(baseUrl: string): Promise<IdentifyResponse> {
  const config = getDimocoConfig();
  const requestId = generateRequestId();
  
  try {
    console.log('[DIMOCO] Calling identify action...');
    
    // Build parameters (without digest first)
    const params: Record<string, string> = {
      action: 'identify',
      merchant: config.merchantId,
      order: config.orderId,
      request_id: requestId,
      url_callback: `${baseUrl}/api/payment/dimoco/identify-callback`,
      url_return: `${baseUrl}/api/payment/dimoco/identify-callback`,
    };

    // Calculate digest from all parameters
    const digest = calculateDigest(params, config.password);
    params.digest = digest;

    // Build form data for POST request
    const formData = new URLSearchParams(params);

    console.log('[DIMOCO] POST identify request to:', config.apiUrl);

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
      },
      body: formData.toString(),
    });

    console.log('[DIMOCO] Identify response status:', response.status, response.statusText);

    const text = await response.text();
    console.log('[DIMOCO] Identify raw response:', text.substring(0, 500));

    // Parse DIMOCO response (XML format)
    const result = parseResponse(text);
    console.log('[DIMOCO] Identify parsed result:', result);
    
    // Check for redirect URL (status 3 means redirect required)
    const redirectUrlMatch = text.match(/<redirect>[\s\S]*?<url>([^<]+)<\/url>[\s\S]*?<\/redirect>/);
    const redirectUrl = redirectUrlMatch ? redirectUrlMatch[1] : null;
    
    // Status 0 = success (user identified), status 3 = redirect required
    const statusCode = result.status;
    
    if (statusCode === '0' || statusCode === 'OK') {
      return {
        success: true,
        msisdn: result.msisdn,
        operator: result.operator,
      };
    }
    
    if (statusCode === '3' || redirectUrl) {
      // Redirect required to DIMOCO for identification
      return {
        success: true,
        redirectUrl: redirectUrl || result.redirect_url,
      };
    }

    return {
      success: false,
      error: result.errormessage || result.detail || result.error || 'Identification failed',
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
 * 
 * DIMOCO API Requirements:
 * - Must use POST request
 * - Must include digest (HMAC-SHA256)
 * - Must include request_id
 * - Must include service_name
 * - Parameter names: url_callback, url_return (not callbackurl, returnurl)
 * - Sandbox requires redirect=1
 * 
 * SANDBOX BEHAVIOR:
 * - Always returns MSISDN: 436763602302
 * - Always returns operator: AT_SANDBOX
 * - Works on WiFi/Desktop (no network restrictions)
 */
export async function startPayment(
  request: PaymentInitRequest
): Promise<PaymentInitResponse> {
  const config = getDimocoConfig();
  const transactionId = generateTransactionId();
  const requestId = generateRequestId();
  const baseUrl = request.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // URLs for callbacks and returns
  const callbackUrl = `${baseUrl}/api/payment/dimoco/callback`;
  const returnUrl = request.returnUrl || `${baseUrl}/de/article/${request.articleSlug}`;

  try {
    // Clean service name - alphanumeric and spaces only, max 50 chars
    const serviceName = request.description
      .substring(0, 50)
      .replace(/[^\w\s\-äöüÄÖÜß]/g, '')
      .trim() || 'Article Unlock';

    // IMPORTANT: url_return should go through our callback handler so we can set the MSISDN cookie
    // The callback handler will then redirect to the final article URL
    const userReturnUrl = `${callbackUrl}?finalRedirect=${encodeURIComponent(returnUrl)}`;

    // Build parameters (without digest first - digest is calculated from these)
    const params: Record<string, string> = {
      action: 'start',
      amount: (request.amount / 100).toFixed(2), // DIMOCO expects amount in EUR
      merchant: config.merchantId,
      order: config.orderId,
      request_id: requestId,
      service_name: serviceName,
      url_callback: callbackUrl,
      url_return: userReturnUrl, // Goes through callback to set cookie, then redirects
      // Custom parameters with cp_ prefix
      cp_articleId: request.articleId,
      cp_brandId: request.brandId,
      cp_transactionId: transactionId,
      cp_returnUrl: returnUrl, // Store original return URL
    };

    // SANDBOX ONLY: redirect=1 is required for sandbox API
    // In production, DIMOCO handles redirects based on the order configuration
    if (config.useSandbox) {
      params.redirect = '1';
    }

    // Add optional metadata as custom parameter
    if (request.metadata) {
      const simplifiedMeta = {
        fp: (request.metadata as Record<string, unknown>).fp || '',
        ip: (request.metadata as Record<string, unknown>).ipAddress || '',
      };
      params.cp_metadata = JSON.stringify(simplifiedMeta);
    }

    // Calculate digest from all parameters
    const digest = calculateDigest(params, config.password);
    params.digest = digest;

    console.log('[DIMOCO] Starting payment...', {
      transactionId,
      requestId,
      amount: params.amount,
      articleId: request.articleId,
      apiUrl: config.apiUrl,
      merchantId: config.merchantId,
      isSandbox: config.useSandbox,
    });

    // Build form data for POST request
    const formData = new URLSearchParams(params);

    console.log('[DIMOCO] POST request to:', config.apiUrl);
    console.log('[DIMOCO] Parameters (digest hidden):', 
      Object.entries(params)
        .filter(([k]) => k !== 'digest')
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    );

    // Make POST request (as required by DIMOCO spec)
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
      },
      body: formData.toString(),
    });

    console.log('[DIMOCO] Response status:', response.status, response.statusText);
    
    const text = await response.text();
    console.log('[DIMOCO] Raw response:', text.substring(0, 500));

    // Parse XML response
    const result = parseResponse(text);
    console.log('[DIMOCO] Parsed response:', result);

    // Check for redirect URL in XML (status 3 = redirect required)
    // Format: /result/action_result/redirect/url
    const redirectUrlMatch = text.match(/<redirect>[\s\S]*?<url>([^<]+)<\/url>[\s\S]*?<\/redirect>/);
    let redirectUrl = redirectUrlMatch ? redirectUrlMatch[1] : null;

    // Also check for other redirect URL formats
    if (!redirectUrl) {
      redirectUrl = result.redirect_url || result.redirecturl || result.url || result.redirect;
    }
    
    // Decode HTML entities in redirect URL (DIMOCO encodes & as &amp;)
    if (redirectUrl) {
      redirectUrl = redirectUrl.replace(/&amp;/g, '&');
    }

    // Status 0 = success, status 3 = redirect required (both are OK)
    const statusCode = result.status;
    const isSuccess = statusCode === '0' || statusCode === 'OK' || 
                      statusCode === '3' || // redirect required
                      statusCode === '5';   // pending
    
    if (isSuccess || redirectUrl) {
      console.log('[DIMOCO] Payment initiation successful');
      console.log('[DIMOCO] Status:', statusCode, '| Redirect URL:', redirectUrl);
      
      return {
        success: true,
        transactionId,
        redirectUrl: redirectUrl || undefined,
        paymentUrl: redirectUrl || undefined,
        msisdn: result.msisdn,
      };
    }

    // Log detailed error info
    const errorCode = result.errorcode || result.code || 'unknown';
    const errorMessage = result.errormessage || result.detail || result.error || 'Unknown error';
    
    console.error('[DIMOCO] Payment initiation failed:', {
      status: statusCode,
      errorCode,
      errorMessage,
      fullResult: result,
    });

    return {
      success: false,
      transactionId,
      error: `DIMOCO Error ${errorCode}: ${errorMessage}`,
    };
  } catch (error) {
    // Log the full error including cause (Node.js fetch wraps the real error)
    const cause = (error as { cause?: Error })?.cause;
    console.error('[DIMOCO] Start error:', error);
    if (cause) {
      console.error('[DIMOCO] Start error cause:', cause.message, cause);
    }
    console.error('[DIMOCO] API URL was:', config.apiUrl);
    
    const errorMsg = cause?.message || (error instanceof Error ? error.message : 'Network error');
    return {
      success: false,
      transactionId,
      error: `DIMOCO connection failed: ${errorMsg} (URL: ${config.apiUrl})`,
    };
  }
}

/**
 * Refund - Process a refund for a completed transaction
 * 
 * DIMOCO API Requirements:
 * - Must use POST request
 * - Must include digest (HMAC-SHA256)
 * - Must include request_id
 * - Uses transaction parameter (the original transaction ID)
 */
export async function refundPayment(request: RefundRequest): Promise<RefundResponse> {
  const config = getDimocoConfig();
  const requestId = generateRequestId();

  try {
    console.log('[DIMOCO] Processing refund...', {
      transactionId: request.transactionId,
      amount: request.amount,
    });

    // Build parameters (without digest first)
    const params: Record<string, string> = {
      action: 'refund',
      amount: (request.amount / 100).toFixed(2), // DIMOCO expects amount in EUR
      merchant: config.merchantId,
      order: config.orderId,
      request_id: requestId,
      transaction: request.transactionId,
    };

    // Calculate digest from all parameters
    const digest = calculateDigest(params, config.password);
    params.digest = digest;

    // Build form data for POST request
    const formData = new URLSearchParams(params);

    console.log('[DIMOCO] POST refund request to:', config.apiUrl);

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    console.log('[DIMOCO] Refund response:', text);

    const result = parseResponse(text);

    // Status 0 = success
    if (result.status === '0' || result.status === 'OK' || result.status === 'ok') {
      return {
        success: true,
        refundId: result.refund_id || result.refundid || request.transactionId,
      };
    }

    return {
      success: false,
      error: result.errormessage || result.detail || result.error || 'Refund failed',
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
 * Parse DIMOCO response (URL-encoded, JSON, or XML format)
 * 
 * DIMOCO XML status codes:
 *   0 = Success (action completed)
 *   3 = Redirect required (user must be redirected to DIMOCO URL)
 *   5 = Pending (waiting for user action)
 *   Other = Error
 */
function parseResponse(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Handle JSON response
  if (text.trim().startsWith('{')) {
    try {
      return JSON.parse(text);
    } catch {
      // Not JSON, continue
    }
  }
  
  // Handle XML response
  if (text.trim().startsWith('<?xml') || text.trim().startsWith('<result')) {
    console.log('[DIMOCO] Parsing XML response...');
    
    // Extract code
    const codeMatch = text.match(/<code>(\d+)<\/code>/);
    if (codeMatch) result.errorcode = codeMatch[1];
    
    // Extract detail/error message
    const detailMatch = text.match(/<detail>([^<]+)<\/detail>/);
    if (detailMatch) result.errormessage = detailMatch[1];
    
    // Extract status - PRESERVE the numeric value (0=success, 3=redirect, 5=pending)
    const statusMatch = text.match(/<status>(\d+)<\/status>/);
    if (statusMatch) {
      result.status = statusMatch[1]; // Keep as '0', '3', '5', etc.
    }
    
    // Extract redirect URL if present
    const urlMatch = text.match(/<url>([^<]+)<\/url>/) || 
                     text.match(/<redirect[^>]*>([^<]+)<\/redirect>/);
    if (urlMatch) result.redirect_url = urlMatch[1];
    
    // Extract MSISDN if present
    const msisdnMatch = text.match(/<msisdn>([^<]+)<\/msisdn>/);
    if (msisdnMatch) result.msisdn = msisdnMatch[1];
    
    // Extract operator if present
    const operatorMatch = text.match(/<operator>([^<]+)<\/operator>/);
    if (operatorMatch) result.operator = operatorMatch[1];
    
    // Extract transaction ID
    const txnIdMatch = text.match(/<transaction>[\s\S]*?<id>([^<]+)<\/id>[\s\S]*?<\/transaction>/);
    if (txnIdMatch) result.transaction_id = txnIdMatch[1];
    
    // Extract request_id
    const requestIdMatch = text.match(/<request_id>([^<]+)<\/request_id>/);
    if (requestIdMatch) result.request_id = requestIdMatch[1];
    
    console.log('[DIMOCO] Parsed XML result:', result);
    return result;
  }
  
  // Handle URL-encoded response
  const pairs = text.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && key.length > 0) {
      result[key.toLowerCase()] = decodeURIComponent(value || '');
    }
  }
  
  return result;
}

/**
 * Verify DIMOCO callback digest (HMAC-SHA256)
 * 
 * DIMOCO sends callbacks as: digest=xxx&data=<XML payload>
 * The digest is calculated the same way as outgoing requests:
 * HMAC-SHA256 of all parameter values (sorted by key) using the merchant password.
 * 
 * For callback verification, the digest is computed over the XML data value.
 */
export function verifyCallbackSignature(data: PaymentCallbackData, receivedSignature: string): boolean {
  const config = getDimocoConfig();
  
  // In sandbox, skip verification
  if (config.useSandbox) {
    console.log('[DIMOCO] Sandbox mode - skipping signature verification');
    return true;
  }

  if (!receivedSignature || !config.password) {
    console.warn('[DIMOCO] Missing signature or password for verification');
    return false;
  }

  // DIMOCO callback digest verification:
  // The digest is HMAC-SHA256 of the XML data payload using the merchant password
  try {
    // Reconstruct what DIMOCO signed: the raw XML data value
    // Since we may have already parsed it, we verify using available data
    const hmac = crypto.createHmac('sha256', config.password);
    
    // Build verification payload from callback data fields (sorted alphabetically)
    const fields: Record<string, string> = {};
    if (data.transactionId) fields.transactionId = data.transactionId;
    if (data.status) fields.status = data.status;
    if (data.msisdn) fields.msisdn = data.msisdn;
    if (data.amount !== undefined) fields.amount = String(data.amount);
    if (data.currency) fields.currency = data.currency;
    
    const sortedKeys = Object.keys(fields).sort();
    const payload = sortedKeys.map(key => fields[key]).join('');
    
    hmac.update(payload, 'utf8');
    const computed = hmac.digest('hex');
    
    const isValid = computed === receivedSignature;
    if (!isValid) {
      console.error('[DIMOCO] Callback signature mismatch!', {
        received: receivedSignature.substring(0, 10) + '...',
        computed: computed.substring(0, 10) + '...',
      });
    }
    return isValid;
  } catch (error) {
    console.error('[DIMOCO] Signature verification error:', error);
    return false;
  }
}

/**
 * Verify raw DIMOCO callback digest against the XML data
 * This is the primary verification method for production callbacks.
 * DIMOCO sends: digest=xxx&data=<URL-encoded XML>
 * The digest = HMAC-SHA256(data_value, password)
 */
export function verifyRawCallbackDigest(digest: string, rawData: string): boolean {
  const config = getDimocoConfig();
  
  if (config.useSandbox) {
    console.log('[DIMOCO] Sandbox mode - skipping raw digest verification');
    return true;
  }

  if (!digest || !rawData || !config.password) {
    console.warn('[DIMOCO] Missing digest, data, or password for verification');
    return !config.password; // If no password configured, skip verification
  }

  try {
    const hmac = crypto.createHmac('sha256', config.password);
    hmac.update(rawData, 'utf8');
    const computed = hmac.digest('hex');
    
    const isValid = computed === digest;
    if (!isValid) {
      console.error('[DIMOCO] Raw callback digest mismatch!');
    } else {
      console.log('[DIMOCO] Callback digest verified successfully');
    }
    return isValid;
  } catch (error) {
    console.error('[DIMOCO] Raw digest verification error:', error);
    return false;
  }
}

/**
 * Parse amount from DIMOCO format (always in EUR, e.g., "0.99" or "0,99")
 * Returns amount in cents
 */
export function parseAmount(amount: string | number): number {
  // If already a small number (looks like euros), convert to cents
  if (typeof amount === 'number') {
    // If < 100, assume euros and convert to cents
    // If >= 100, assume already in cents
    return amount < 100 ? Math.round(amount * 100) : Math.round(amount);
  }
  
  const cleaned = amount.replace(/[^\d.,]/g, '');
  
  // Handle European format (comma as decimal separator)
  // e.g., "0,99" → 0.99 → 99 cents
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parsed = parseFloat(cleaned.replace(',', '.'));
    // DIMOCO sends euros, so multiply by 100 to get cents
    return Math.round(parsed * 100);
  }
  
  // Standard decimal format (e.g., "0.99")
  const parsed = parseFloat(cleaned);
  
  // If it has a decimal point and is less than 100, it's likely euros
  // e.g., "0.99" → 99 cents
  if (cleaned.includes('.') && parsed < 100) {
    return Math.round(parsed * 100);
  }
  
  // If it's a whole number >= 100, it's likely already cents
  // e.g., "99" could be 99 cents, but "9900" is definitely cents
  // For safety, if no decimal and value looks like cents, keep as is
  if (!cleaned.includes('.') && !cleaned.includes(',')) {
    // Small whole numbers (< 10) are ambiguous, assume euros
    // e.g., "1" → 100 cents (1 EUR)
    if (parsed < 10) {
      return Math.round(parsed * 100);
    }
    // Larger whole numbers, assume cents
    // e.g., "99" → 99 cents, "150" → 150 cents
    return Math.round(parsed);
  }
  
  return Math.round(parsed * 100);
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
