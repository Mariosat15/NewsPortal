import { NextRequest, NextResponse } from 'next/server';
import { identifyUser, getDimocoConfig } from '@/lib/dimoco/client';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUserRepository, getCustomerRepository, getTrackingRepository } from '@/lib/db';
import { extractIpFromRequest } from '@/lib/services/msisdn-detection';
import { detectNetworkType } from '@/lib/services/carrier-ip-ranges';
import { normalizePhoneNumber } from '@/lib/utils/phone';

export const dynamic = 'force-dynamic';

/**
 * POST /api/identify/msisdn
 * 
 * Initiates MSISDN detection via DIMOCO identify action.
 * Called when a user visits a landing page on mobile data.
 * 
 * Returns either:
 * - { success: true, msisdn: "...", redirectUrl?: "..." } - MSISDN detected
 * - { success: true, redirectUrl: "..." } - Redirect required for detection
 * - { success: false, error: "..." } - Detection failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      landingPageSlug, 
      landingPageId, 
      returnUrl,
      utm,
      sessionId,
    } = body;

    // Get client info
    const ip = extractIpFromRequest(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check network type - only proceed on mobile data
    const networkResult = detectNetworkType(ip);
    
    if (!networkResult.isMobileNetwork) {
      console.log('[MSISDN Identify] Not on mobile network, skipping detection');
      return NextResponse.json({
        success: false,
        error: 'Not on mobile network',
        networkType: networkResult.networkType,
      });
    }

    console.log('[MSISDN Identify] Starting identification...', {
      landingPageSlug,
      carrier: networkResult.carrier?.name,
      ip: ip.substring(0, 8) + '***',
    });

    // Check if MSISDN already in cookies
    const existingMsisdn = request.cookies.get('user_msisdn')?.value;
    if (existingMsisdn) {
      console.log('[MSISDN Identify] Already have MSISDN in cookie');
      
      // Update user visit - pass carrier and network type
      await updateUserVisit(
        existingMsisdn, 
        landingPageSlug, 
        landingPageId, 
        utm, 
        ip, 
        userAgent, 
        sessionId,
        networkResult.carrier?.name,
        networkResult.isMobileNetwork ? 'MOBILE_DATA' : 'WIFI'
      );
      
      return NextResponse.json({
        success: true,
        msisdn: existingMsisdn,
        alreadyIdentified: true,
      });
    }

    // Check DIMOCO config
    const config = getDimocoConfig();
    if (!config.password) {
      console.log('[MSISDN Identify] No DIMOCO credentials, cannot identify');
      return NextResponse.json({
        success: false,
        error: 'DIMOCO not configured',
      });
    }

    // Get base URL from request
    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : 'http://localhost:3000';

    // Store return context in a temporary cookie for the callback
    const identifyState = JSON.stringify({
      returnUrl: returnUrl || `${baseUrl}/lp/${landingPageSlug}`,
      landingPageSlug,
      landingPageId,
      utm,
      sessionId,
      ip,
      userAgent,
      carrier: networkResult.carrier?.name,
      country: networkResult.carrier?.country,
    });

    // Call DIMOCO identify
    const result = await identifyUser(baseUrl);

    if (result.success && result.msisdn) {
      // MSISDN detected directly (header enrichment worked)
      console.log('[MSISDN Identify] Direct identification successful:', result.msisdn.substring(0, 6) + '****');
      
      const normalizedMsisdn = normalizePhoneNumber(result.msisdn);

      // Update visitor session with MSISDN if we have a sessionId
      if (sessionId) {
        try {
          const trackingRepo = getTrackingRepository(getBrandIdSync());
          await trackingRepo.setSessionMsisdn(
            sessionId,
            result.msisdn,
            normalizedMsisdn,
            'CONFIRMED',
            networkResult.carrier?.name || result.operator
          );
          // Also update network type
          await trackingRepo.updateSession(sessionId, {
            networkType: networkResult.isMobileNetwork ? 'MOBILE_DATA' : 'WIFI',
            carrier: networkResult.carrier?.name || result.operator,
            lastSeenAt: new Date(),
          });
          console.log('[MSISDN Identify] Updated visitor session:', sessionId.substring(0, 15) + '...');
        } catch (trackingError) {
          console.error('[MSISDN Identify] Error updating visitor session:', trackingError);
        }
      }

      // Create/update user and customer records
      await createOrUpdateUserAndCustomer(
        result.msisdn,
        landingPageSlug,
        landingPageId,
        utm,
        ip,
        userAgent,
        sessionId,
        networkResult.carrier?.name,
        networkResult.carrier?.country,
        result.operator,
        'dimoco_identify'
      );

      // Return success with MSISDN
      const response = NextResponse.json({
        success: true,
        msisdn: result.msisdn,
        operator: result.operator,
      });

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

    if (result.success && result.redirectUrl) {
      // Redirect required for identification
      console.log('[MSISDN Identify] Redirect required:', result.redirectUrl);
      
      // Return redirect URL with state cookie
      const response = NextResponse.json({
        success: true,
        redirectUrl: result.redirectUrl,
        requiresRedirect: true,
      });

      // Store state for callback
      response.cookies.set('msisdn_identify_state', identifyState, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 5, // 5 minutes
        path: '/',
      });

      return response;
    }

    // Identification failed
    console.error('[MSISDN Identify] Failed:', result.error);
    return NextResponse.json({
      success: false,
      error: result.error || 'Identification failed',
    });

  } catch (error) {
    console.error('[MSISDN Identify] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Update existing user's visit record
 */
async function updateUserVisit(
  msisdn: string,
  landingPageSlug: string | undefined,
  landingPageId: string | undefined,
  utm: Record<string, string> | undefined,
  ip: string,
  userAgent: string,
  sessionId: string | undefined,
  carrier?: string,
  networkType?: string
) {
  try {
    const brandId = getBrandIdSync();
    const userRepo = getUserRepository(brandId);
    const customerRepo = getCustomerRepository(brandId);
    const trackingRepo = getTrackingRepository(brandId);
    const normalizedMsisdn = normalizePhoneNumber(msisdn);

    // Update visitor session with MSISDN if we have a sessionId
    if (sessionId) {
      try {
        await trackingRepo.setSessionMsisdn(
          sessionId,
          msisdn,
          normalizedMsisdn,
          'CONFIRMED',
          carrier
        );
        await trackingRepo.updateSession(sessionId, {
          networkType: networkType as 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN' || 'MOBILE_DATA',
          carrier,
          lastSeenAt: new Date(),
        });
      } catch (trackingError) {
        console.error('[MSISDN Identify] Error updating visitor session:', trackingError);
      }
    }

    // Update user visits
    await userRepo.addVisit(normalizedMsisdn, {
      ip,
      userAgent,
      referrer: '',
      page: landingPageSlug ? `/lp/${landingPageSlug}` : '/',
      sessionId: sessionId || '',
    });

    // Update customer visits
    await customerRepo.recordVisit(normalizedMsisdn, {
      sessionId: sessionId || '',
      landingPageSlug,
      campaign: utm?.campaign,
      source: utm?.source,
    });

    console.log('[MSISDN Identify] Updated visit for:', normalizedMsisdn.substring(0, 6) + '****');
  } catch (error) {
    console.error('[MSISDN Identify] Error updating visit:', error);
  }
}

/**
 * Create or update user and customer records when MSISDN is detected
 */
async function createOrUpdateUserAndCustomer(
  msisdn: string,
  landingPageSlug: string | undefined,
  landingPageId: string | undefined,
  utm: Record<string, string> | undefined,
  ip: string,
  userAgent: string,
  sessionId: string | undefined,
  carrier: string | undefined,
  country: string | undefined,
  operator: string | undefined,
  source: 'dimoco_identify' | 'header_enrichment'
) {
  try {
    const brandId = getBrandIdSync();
    const userRepo = getUserRepository(brandId);
    const customerRepo = getCustomerRepository(brandId);
    const normalizedMsisdn = normalizePhoneNumber(msisdn);

    // Create or update user
    const existingUser = await userRepo.findByMsisdn(normalizedMsisdn);
    
    if (existingUser) {
      // Update existing user
      await userRepo.addVisit(normalizedMsisdn, {
        ip,
        userAgent,
        referrer: '',
        page: landingPageSlug ? `/lp/${landingPageSlug}` : '/',
        sessionId: sessionId || '',
      });

      if (landingPageSlug) {
        await userRepo.addLandingPageVisit(normalizedMsisdn, {
          landingPageSlug,
          landingPageId,
          utm,
        });
      }
    } else {
      // Create new user
      await userRepo.createMsisdnUser({
        msisdn,
        ip,
        userAgent,
        page: landingPageSlug ? `/lp/${landingPageSlug}` : '/',
        sessionId,
        msisdnSource: source,
        landingPageSlug,
        landingPageId,
        carrier: carrier || operator,
        country,
        utm,
      });
    }

    // Create or update customer (visitor status)
    await customerRepo.upsertIdentified({
      msisdn,
      normalizedMsisdn,
      tenantId: brandId,
      landingPageSlug,
      campaign: utm?.campaign,
      source: utm?.source,
      carrier: carrier || operator,
      country,
      conversionStatus: 'identified',
    });

    console.log('[MSISDN Identify] Created/updated records for:', normalizedMsisdn.substring(0, 6) + '****');
  } catch (error) {
    console.error('[MSISDN Identify] Error creating records:', error);
  }
}
