import { NextRequest, NextResponse } from 'next/server';
import { detectMsisdn, detectMsisdnFromHeaders } from '@/lib/services/msisdn-detection';
import { detectNetworkType } from '@/lib/services/carrier-ip-ranges';
import { v4 as uuidv4 } from 'uuid';

const SESSION_COOKIE_NAME = 'news_session';
const MSISDN_COOKIE_NAME = 'user_msisdn';
const NETWORK_TYPE_COOKIE_NAME = 'network_type';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * MSISDN Detection Middleware
 * Runs on every request to:
 * 1. Detect and store MSISDN from carrier headers
 * 2. Detect network type (Mobile Data vs WiFi)
 * 3. Create/maintain session
 * 4. Set cookies for persistence
 */
export async function msisdnDetectionMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  try {
    // Get or create session ID
    let sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionId) {
      sessionId = uuidv4();
      response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
    }

    // Check if we already have MSISDN in cookie
    const existingMsisdn = request.cookies.get(MSISDN_COOKIE_NAME)?.value;
    
    // Get IP for network detection
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '0.0.0.0';

    // Detect network type
    const networkResult = detectNetworkType(ip);
    
    // Store network type in cookie
    response.cookies.set(NETWORK_TYPE_COOKIE_NAME, networkResult.networkType, {
      httpOnly: false, // Allow client-side access for UI updates
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes - network can change
      path: '/',
    });

    // Only attempt MSISDN detection if:
    // 1. We don't already have it
    // 2. User is on mobile network
    // 3. Not on admin or API routes (to avoid performance hit)
    const pathname = request.nextUrl.pathname;
    const isApiRoute = pathname.startsWith('/api/');
    const isAdminRoute = pathname.startsWith('/admin');
    
    if (!existingMsisdn && !isApiRoute && !isAdminRoute) {
      // Try header enrichment first (fast)
      const headerResult = detectMsisdnFromHeaders(request.headers);
      
      if (headerResult.msisdn) {
        // Found MSISDN in headers - store it (real carrier header enrichment)
        response.cookies.set(MSISDN_COOKIE_NAME, headerResult.msisdn, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: SESSION_MAX_AGE,
          path: '/',
        });
        
        console.log('[MSISDN Middleware] MSISDN detected via carrier headers:', 
          headerResult.msisdn.substring(0, 4) + '****' + headerResult.msisdn.substring(headerResult.msisdn.length - 2)
        );
      } else if (networkResult.isMobileNetwork) {
        // On mobile network but no header enrichment
        // DO NOT generate fake MSISDNs - this creates ghost users!
        // Real MSISDN will only come from:
        // 1. Carrier header enrichment (if carrier supports it)
        // 2. DIMOCO payment callback (after user makes a purchase)
        console.log('[MSISDN Middleware] Mobile network detected but no header enrichment. MSISDN will be set after payment.');
      }
    }

    return response;
  } catch (error) {
    console.error('[MSISDN Middleware] Error:', error);
    // Don't block the request on error
    return response;
  }
}

/**
 * Helper to add MSISDN detection to middleware chain
 * Usage in middleware.ts:
 * 
 * const response = NextResponse.next();
 * return await msisdnDetectionMiddleware(request, response);
 */
export function withMsisdnDetection(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next();
  return msisdnDetectionMiddleware(request, response);
}
