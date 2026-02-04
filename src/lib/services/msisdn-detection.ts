/**
 * MSISDN Detection Service
 * 
 * Detects mobile phone numbers (MSISDN) using:
 * 1. HTTP Header Enrichment (carrier-injected headers)
 * 2. Network type detection (IP ranges)
 * 3. Dimoco identification API (fallback)
 */

import { detectNetworkType, CarrierInfo, NetworkDetectionResult } from './carrier-ip-ranges';
import { normalizePhoneNumber, isValidPhoneNumber } from '@/lib/utils/phone';

export interface MsisdnDetectionResult {
  msisdn?: string;
  normalizedMsisdn?: string;
  confidence: 'CONFIRMED' | 'UNCONFIRMED' | 'NONE';
  networkType: 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN';
  carrier?: string;
  carrierCode?: string;
  detectionMethod?: 'header_enrichment' | 'dimoco_api' | 'none';
  error?: string;
}

// Common HTTP headers used for MSISDN enrichment by carriers
const MSISDN_HEADERS = [
  'x-msisdn',
  'x-nokia-msisdn',
  'x-up-calling-line-id',
  'x-wap-network-client-msisdn',
  'x-network-info',
  'msisdn',
  'x-ericsson-msisdn',
  'x-huawei-msisdn',
  'x-acr',
  'x-forwarded-for-msisdn',
  'x-party-id',
  'x-subscriber-id',
];

// Additional headers that might contain carrier info
const CARRIER_HEADERS = [
  'x-mcc-mnc',
  'x-carrier',
  'x-network-type',
  'via',
];

/**
 * Extract MSISDN from HTTP request headers
 */
export function detectMsisdnFromHeaders(headers: Headers | Record<string, string>): {
  msisdn?: string;
  carrier?: string;
  mccMnc?: string;
} {
  // Convert Headers object to Record if needed
  const headerMap: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      headerMap[key.toLowerCase()] = value;
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      headerMap[key.toLowerCase()] = value;
    });
  }

  let msisdn: string | undefined;
  let carrier: string | undefined;
  let mccMnc: string | undefined;

  // Check MSISDN headers
  for (const header of MSISDN_HEADERS) {
    const value = headerMap[header];
    if (value) {
      // Some headers contain MSISDN in a specific format
      const extracted = extractMsisdnFromHeader(value);
      if (extracted && isValidPhoneNumber(extracted)) {
        msisdn = extracted;
        break;
      }
    }
  }

  // Check carrier headers
  for (const header of CARRIER_HEADERS) {
    const value = headerMap[header];
    if (value) {
      if (header === 'x-mcc-mnc') {
        mccMnc = value;
      } else if (header === 'x-carrier') {
        carrier = value;
      }
    }
  }

  return { msisdn, carrier, mccMnc };
}

/**
 * Extract MSISDN from various header value formats
 */
function extractMsisdnFromHeader(value: string): string | undefined {
  if (!value) return undefined;

  // Try direct number
  if (/^\+?\d{8,15}$/.test(value.replace(/[\s-]/g, ''))) {
    return value.replace(/[\s-]/g, '');
  }

  // Try MSISDN=value format
  const msisdnMatch = value.match(/MSISDN[=:]\s*(\+?\d{8,15})/i);
  if (msisdnMatch) {
    return msisdnMatch[1];
  }

  // Try tel: URI format
  const telMatch = value.match(/tel:(\+?\d{8,15})/i);
  if (telMatch) {
    return telMatch[1];
  }

  return undefined;
}

/**
 * Detect MSISDN via Dimoco identification API
 */
export async function detectMsisdnViaDimoco(
  sessionId: string,
  ip: string,
  userAgent: string
): Promise<{ msisdn?: string; error?: string }> {
  const apiUrl = process.env.DIMOCO_IDENTIFY_URL;
  const apiKey = process.env.DIMOCO_IDENTIFY_KEY || process.env.DIMOCO_API_KEY;

  if (!apiUrl || !apiKey) {
    return { error: 'Dimoco identification API not configured' };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        session_id: sessionId,
        ip_address: ip,
        user_agent: userAgent,
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return { error: `Dimoco API error: ${response.status}` };
    }

    const data = await response.json();
    
    if (data.msisdn) {
      return { msisdn: data.msisdn };
    }
    
    return { error: data.error || 'MSISDN not available' };
  } catch (error) {
    console.error('[MSISDN Detection] Dimoco API error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Main MSISDN detection function
 * Tries header enrichment first, then falls back to Dimoco API if on mobile network
 */
export async function detectMsisdn(
  request: Request,
  options: {
    sessionId: string;
    customCarrierRanges?: CarrierInfo[];
    skipDimocoFallback?: boolean;
  }
): Promise<MsisdnDetectionResult> {
  const { sessionId, customCarrierRanges, skipDimocoFallback = false } = options;

  // Get client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '0.0.0.0';

  // Get user agent
  const userAgent = request.headers.get('user-agent') || '';

  // Detect network type from IP
  const networkResult: NetworkDetectionResult = detectNetworkType(ip, customCarrierRanges);

  // Step 1: Try header enrichment
  const headerResult = detectMsisdnFromHeaders(request.headers);
  
  if (headerResult.msisdn) {
    const normalizedMsisdn = normalizePhoneNumber(headerResult.msisdn);
    
    return {
      msisdn: headerResult.msisdn,
      normalizedMsisdn,
      confidence: 'CONFIRMED',
      networkType: networkResult.networkType,
      carrier: headerResult.carrier || networkResult.carrier?.name,
      carrierCode: headerResult.mccMnc || networkResult.carrier?.code,
      detectionMethod: 'header_enrichment',
    };
  }

  // Step 2: If on mobile network and Dimoco is configured, try API detection
  if (networkResult.isMobileNetwork && !skipDimocoFallback) {
    const dimocoResult = await detectMsisdnViaDimoco(sessionId, ip, userAgent);
    
    if (dimocoResult.msisdn) {
      const normalizedMsisdn = normalizePhoneNumber(dimocoResult.msisdn);
      
      return {
        msisdn: dimocoResult.msisdn,
        normalizedMsisdn,
        confidence: 'CONFIRMED',
        networkType: 'MOBILE_DATA',
        carrier: networkResult.carrier?.name,
        carrierCode: networkResult.carrier?.code,
        detectionMethod: 'dimoco_api',
      };
    }

    // Dimoco failed but we know it's mobile network
    return {
      confidence: 'NONE',
      networkType: 'MOBILE_DATA',
      carrier: networkResult.carrier?.name,
      carrierCode: networkResult.carrier?.code,
      detectionMethod: 'none',
      error: dimocoResult.error,
    };
  }

  // Step 3: No MSISDN available
  return {
    confidence: 'NONE',
    networkType: networkResult.networkType,
    carrier: networkResult.carrier?.name,
    carrierCode: networkResult.carrier?.code,
    detectionMethod: 'none',
  };
}

/**
 * Extract IP address from request
 */
export function extractIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp || '0.0.0.0';
}

/**
 * Parse user agent for device info
 */
export function parseUserAgent(userAgent: string): {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  model?: string;
  vendor?: string;
} {
  const ua = userAgent.toLowerCase();
  
  // Device type
  let type: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    type = 'mobile';
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    type = 'tablet';
  } else if (/windows|macintosh|linux/i.test(ua)) {
    type = 'desktop';
  }

  // OS detection
  let os: string | undefined;
  let osVersion: string | undefined;
  
  if (/android/i.test(ua)) {
    os = 'Android';
    const match = ua.match(/android\s*([\d.]+)/i);
    if (match) osVersion = match[1];
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
    const match = ua.match(/os\s*([\d_]+)/i);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
    const match = ua.match(/windows\s*nt\s*([\d.]+)/i);
    if (match) osVersion = match[1];
  } else if (/macintosh|mac os/i.test(ua)) {
    os = 'macOS';
    const match = ua.match(/mac\s*os\s*x?\s*([\d_.]+)/i);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser detection
  let browser: string | undefined;
  let browserVersion: string | undefined;

  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/i);
    if (match) browserVersion = match[1];
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
    const match = ua.match(/version\/([\d.]+)/i);
    if (match) browserVersion = match[1];
  } else if (/firefox/i.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/i);
    if (match) browserVersion = match[1];
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Edge';
    const match = ua.match(/edg[e]?\/([\d.]+)/i);
    if (match) browserVersion = match[1];
  }

  // Vendor/Model
  let vendor: string | undefined;
  let model: string | undefined;

  if (/samsung/i.test(ua)) {
    vendor = 'Samsung';
    const match = ua.match(/sm-([a-z0-9]+)/i);
    if (match) model = match[1];
  } else if (/huawei/i.test(ua)) {
    vendor = 'Huawei';
  } else if (/xiaomi/i.test(ua)) {
    vendor = 'Xiaomi';
  } else if (/iphone/i.test(ua)) {
    vendor = 'Apple';
    model = 'iPhone';
  } else if (/ipad/i.test(ua)) {
    vendor = 'Apple';
    model = 'iPad';
  }

  return { type, os, osVersion, browser, browserVersion, model, vendor };
}
