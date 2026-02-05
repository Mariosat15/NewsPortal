import { NextRequest, NextResponse } from 'next/server';
import { identifyUser } from '@/lib/dimoco/client';

export const dynamic = 'force-dynamic';

/**
 * DIMOCO MSISDN Identification
 * 
 * This endpoint initiates MSISDN detection via DIMOCO's header enrichment.
 * When a user on mobile data calls this, DIMOCO reads the carrier headers
 * and returns the user's phone number.
 * 
 * Flow:
 * 1. User clicks "Unlock Article" on mobile data
 * 2. Frontend calls this endpoint
 * 3. This redirects to DIMOCO identify action
 * 4. DIMOCO reads carrier headers and detects MSISDN
 * 5. DIMOCO redirects to /api/payment/dimoco/identify-callback with MSISDN
 * 6. Callback stores MSISDN and proceeds to payment
 */
export async function GET(request: NextRequest) {
  try {
    // Get base URL from request
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const host = request.headers.get('host');
    
    const effectiveHost = forwardedHost || host;
    const effectiveProto = forwardedProto || (effectiveHost?.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${effectiveProto}://${effectiveHost}`;

    // Get article info from query params to pass through
    const articleId = request.nextUrl.searchParams.get('articleId');
    const slug = request.nextUrl.searchParams.get('slug');

    console.log('[MSISDN Identify] Initiating DIMOCO identify...', { baseUrl, articleId, slug });

    // Call DIMOCO identify
    const result = await identifyUser(baseUrl);

    if (result.success && result.msisdn) {
      // DIMOCO identified the user directly (rare, usually requires redirect)
      console.log('[MSISDN Identify] Direct identification successful:', result.msisdn);
      
      // Store MSISDN in cookie and proceed to payment
      const returnUrl = articleId && slug 
        ? `${baseUrl}/api/payment/dimoco/initiate?articleId=${articleId}&slug=${slug}&msisdn=${result.msisdn}`
        : baseUrl;

      const response = NextResponse.redirect(returnUrl);
      
      // Set MSISDN cookie
      response.cookies.set('user_msisdn', result.msisdn, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });

      return response;
    }

    // If no direct result, identifyUser should have returned a redirect URL
    // In most cases, DIMOCO will redirect to their page first
    return NextResponse.json({
      success: false,
      error: result.error || 'MSISDN identification not available. Please ensure you are on mobile data (4G/5G).',
    }, { status: 400 });

  } catch (error) {
    console.error('[MSISDN Identify] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate MSISDN detection',
    }, { status: 500 });
  }
}
