import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUserRepository, getCustomerRepository, getTrackingRepository } from '@/lib/db';
import { extractIpFromRequest } from '@/lib/services/msisdn-detection';
import { detectNetworkType } from '@/lib/services/carrier-ip-ranges';
import { normalizePhoneNumber } from '@/lib/utils/phone';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tracking/identify
 * 
 * Track page views for identified users (users with detected MSISDN)
 * Called automatically by the MsisdnDetector component when navigating
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      msisdn,
      sessionId,
      page,
      landingPageSlug,
      utm,
    } = body;

    if (!msisdn) {
      return NextResponse.json({ success: false, error: 'MSISDN required' }, { status: 400 });
    }

    const ip = extractIpFromRequest(request);
    const userAgent = request.headers.get('user-agent') || '';
    const brandId = getBrandIdSync();
    const normalizedMsisdn = normalizePhoneNumber(msisdn);

    // Detect network type
    const networkResult = detectNetworkType(ip);
    const networkType = networkResult.isMobileNetwork ? 'MOBILE_DATA' : 'WIFI';
    const carrier = networkResult.carrier?.name;

    console.log('[Tracking Identify] Recording visit:', {
      msisdn: msisdn.substring(0, 6) + '****',
      sessionId: sessionId?.substring(0, 10) + '...',
      page: page || landingPageSlug || 'main-site',
      networkType,
      carrier,
    });

    // Update visitor session with MSISDN if we have a sessionId
    if (sessionId) {
      try {
        const trackingRepo = getTrackingRepository(brandId);
        await trackingRepo.setSessionMsisdn(
          sessionId,
          msisdn,
          normalizedMsisdn,
          'CONFIRMED',
          carrier
        );
        // Also update network type
        await trackingRepo.updateSession(sessionId, {
          networkType,
          carrier,
          lastSeenAt: new Date(),
        });
      } catch (trackingError) {
        console.error('[Tracking Identify] Error updating session:', trackingError);
      }
    }

    // Update user visit
    try {
      const userRepo = getUserRepository(brandId);
      await userRepo.addVisit(normalizedMsisdn, {
        ip,
        userAgent,
        referrer: request.headers.get('referer') || '',
        page: page || '/',
        sessionId: sessionId || '',
      });

      // If it's a landing page visit, also add to landing page visits
      if (landingPageSlug) {
        await userRepo.addLandingPageVisit(normalizedMsisdn, {
          landingPageSlug,
          utm,
        });
      }
    } catch (userError) {
      console.error('[Tracking Identify] Error updating user:', userError);
    }

    // Update customer visit
    try {
      const customerRepo = getCustomerRepository(brandId);
      await customerRepo.recordVisit(normalizedMsisdn, {
        sessionId: sessionId || '',
        landingPageSlug,
        campaign: utm?.campaign,
        source: utm?.source,
      });
    } catch (customerError) {
      console.error('[Tracking Identify] Error updating customer:', customerError);
    }

    return NextResponse.json({ 
      success: true,
      detected: true,
      networkType,
      carrier,
    });
  } catch (error) {
    console.error('[Tracking Identify] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track' },
      { status: 500 }
    );
  }
}
