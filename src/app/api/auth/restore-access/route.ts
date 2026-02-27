import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUnlockRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';
import { identifyUser } from '@/lib/dimoco/client';

export const dynamic = 'force-dynamic';

/**
 * Restore Access / Cross-Browser Purchase Recovery
 * 
 * When a user purchases an article in one browser (e.g. Safari) and then
 * opens it in another browser (e.g. Chrome), they won't have the MSISDN cookie.
 * 
 * This endpoint re-identifies the user via DIMOCO carrier header enrichment
 * (works on mobile data), sets the MSISDN cookie, and redirects back to the article.
 * 
 * Flow:
 * 1. User clicks "Already purchased? Restore access" on the paywall
 * 2. This endpoint is called with the article slug and return URL
 * 3. We attempt DIMOCO identification to get the user's MSISDN from the carrier
 * 4. If identified, we check if they have an unlock for the article
 * 5. Set MSISDN cookie and redirect back to the article
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const returnUrl = request.nextUrl.searchParams.get('returnUrl');

  // Get base URL from request
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');
  const effectiveHost = forwardedHost || host;
  const effectiveProto = forwardedProto || (effectiveHost?.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${effectiveProto}://${effectiveHost}`;

  const fallbackUrl = returnUrl || (slug ? `${baseUrl}/de/article/${slug}` : baseUrl);

  try {
    const brandId = getBrandIdSync();

    // Step 1: Check if user already has MSISDN in cookie (maybe they just need a refresh)
    const existingMsisdn = request.cookies.get('user_msisdn')?.value;
    if (existingMsisdn) {
      console.log('[Restore Access] User already has MSISDN cookie, redirecting back');
      return NextResponse.redirect(new URL(fallbackUrl));
    }

    // Step 2: Try DIMOCO identification (carrier header enrichment)
    console.log('[Restore Access] Attempting DIMOCO identify for MSISDN recovery...');
    
    const isSandbox = process.env.DIMOCO_API_URL?.includes('sandbox');
    const hasCredentials = !!process.env.DIMOCO_PASSWORD;

    if (hasCredentials && !isSandbox) {
      // Production: Use real DIMOCO identify
      try {
        const result = await identifyUser(baseUrl);

        if (result.success && result.msisdn) {
          console.log('[Restore Access] DIMOCO identified user:', result.msisdn.substring(0, 6) + '****');

          // Check if this MSISDN has any unlocks
          const unlockRepo = getUnlockRepository(brandId);
          const unlocks = await unlockRepo.getUserUnlocks(result.msisdn);

          if (unlocks.length > 0) {
            console.log(`[Restore Access] Found ${unlocks.length} unlocked articles for this MSISDN`);

            // Set MSISDN cookie and redirect back
            const redirectUrl = new URL(fallbackUrl);
            redirectUrl.searchParams.set('restored', 'true');
            const response = NextResponse.redirect(redirectUrl);

            response.cookies.set('user_msisdn', result.msisdn, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 365, // 1 year
              path: '/',
            });

            return response;
          } else {
            console.log('[Restore Access] MSISDN identified but no purchases found');
            const redirectUrl = new URL(fallbackUrl);
            redirectUrl.searchParams.set('restore_error', 'no_purchases');
            return NextResponse.redirect(redirectUrl);
          }
        }
      } catch (identifyError) {
        console.error('[Restore Access] DIMOCO identify failed:', identifyError);
      }
    }

    // Step 3: Fallback - Try to find purchases by IP address (best effort)
    // This helps when DIMOCO identify isn't available (sandbox/mock mode)
    try {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || request.headers.get('cf-connecting-ip')
        || 'unknown';

      if (ip !== 'unknown') {
        console.log('[Restore Access] Trying IP-based recovery...');
        const transactionsCollection = await getCollection(brandId, 'transactions');
        
        // Find recent completed transactions from this IP
        const recentTransaction = await transactionsCollection.findOne({
          status: 'completed',
          'metadata.ipAddress': ip,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        }, { sort: { createdAt: -1 } });

        if (recentTransaction?.msisdn) {
          console.log('[Restore Access] Found transaction via IP match');

          // Verify this MSISDN has unlocks
          const unlockRepo = getUnlockRepository(brandId);
          const unlocks = await unlockRepo.getUserUnlocks(recentTransaction.msisdn);

          if (unlocks.length > 0) {
            const redirectUrl = new URL(fallbackUrl);
            redirectUrl.searchParams.set('restored', 'true');
            const response = NextResponse.redirect(redirectUrl);

            response.cookies.set('user_msisdn', recentTransaction.msisdn, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 365,
              path: '/',
            });

            return response;
          }
        }
      }
    } catch (ipError) {
      console.error('[Restore Access] IP-based recovery failed:', ipError);
    }

    // Step 4: Nothing found - redirect back with error
    console.log('[Restore Access] Could not recover access');
    const redirectUrl = new URL(fallbackUrl);
    redirectUrl.searchParams.set('restore_error', 'not_found');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('[Restore Access] Error:', error);
    return NextResponse.redirect(new URL(fallbackUrl));
  }
}
