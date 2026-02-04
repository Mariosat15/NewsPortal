import { NextRequest, NextResponse } from 'next/server';
import { getTrackingRepository, getCustomerRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { detectMsisdn, extractIpFromRequest, parseUserAgent } from '@/lib/services/msisdn-detection';
import { detectNetworkType } from '@/lib/services/carrier-ip-ranges';

export async function POST(request: NextRequest) {
  try {
    const brandId = await getBrandId();
    const body = await request.json();

    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const trackingRepo = getTrackingRepository(brandId);
    const customerRepo = getCustomerRepository(brandId);

    // Get existing session
    const session = await trackingRepo.findSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found. Create session first.' },
        { status: 404 }
      );
    }

    // If MSISDN already confirmed, return early
    if (session.msisdnConfidence === 'CONFIRMED') {
      return NextResponse.json({
        success: true,
        detected: true,
        msisdn: '***' + session.msisdn!.slice(-4),
        confidence: session.msisdnConfidence,
        networkType: session.networkType,
        carrier: session.carrier,
        alreadyDetected: true,
      });
    }

    // Detect network type first
    const ip = extractIpFromRequest(request);
    const networkResult = detectNetworkType(ip);

    // Update network type if not already set
    if (session.networkType === 'UNKNOWN') {
      await trackingRepo.updateSession(sessionId, {
        networkType: networkResult.networkType,
        carrier: networkResult.carrier?.name,
        carrierCode: networkResult.carrier?.code,
      });
    }

    // Attempt MSISDN detection
    const detectionResult = await detectMsisdn(request, {
      sessionId,
      skipDimocoFallback: false,
    });

    // Update session with detection results
    await trackingRepo.updateSession(sessionId, {
      msisdn: detectionResult.msisdn,
      normalizedMsisdn: detectionResult.normalizedMsisdn,
      msisdnConfidence: detectionResult.confidence,
      networkType: detectionResult.networkType,
      carrier: detectionResult.carrier,
      carrierCode: detectionResult.carrierCode,
    });

    // If MSISDN detected, create/update customer and backfill events
    if (detectionResult.msisdn && detectionResult.normalizedMsisdn) {
      // Backfill MSISDN on existing events for this session
      await trackingRepo.backfillMsisdn(
        sessionId,
        detectionResult.msisdn,
        detectionResult.normalizedMsisdn
      );

      // Upsert customer
      await customerRepo.upsert({
        msisdn: detectionResult.msisdn,
        normalizedMsisdn: detectionResult.normalizedMsisdn,
        tenantId: brandId,
        sessionId,
        landingPageSlug: session.landingPageSlug,
        campaign: session.utm?.campaign,
        source: session.utm?.source,
      });
    }

    return NextResponse.json({
      success: true,
      detected: !!detectionResult.msisdn,
      msisdn: detectionResult.msisdn ? '***' + detectionResult.msisdn.slice(-4) : null,
      confidence: detectionResult.confidence,
      networkType: detectionResult.networkType,
      carrier: detectionResult.carrier,
      detectionMethod: detectionResult.detectionMethod,
      error: detectionResult.error,
    });
  } catch (error) {
    console.error('[Tracking Identify API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking detection status
export async function GET(request: NextRequest) {
  try {
    const brandId = await getBrandId();
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const trackingRepo = getTrackingRepository(brandId);
    const session = await trackingRepo.findSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Also return network type detection based on current IP
    const ip = extractIpFromRequest(request);
    const networkResult = detectNetworkType(ip);

    return NextResponse.json({
      success: true,
      detected: session.msisdnConfidence === 'CONFIRMED',
      msisdn: session.msisdn ? '***' + session.msisdn.slice(-4) : null,
      confidence: session.msisdnConfidence,
      networkType: session.networkType,
      carrier: session.carrier,
      currentNetwork: {
        type: networkResult.networkType,
        isMobile: networkResult.isMobileNetwork,
        carrier: networkResult.carrier?.name,
      },
    });
  } catch (error) {
    console.error('[Tracking Identify API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
