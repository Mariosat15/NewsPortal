import { NextRequest, NextResponse } from 'next/server';
import { getTrackingRepository, getCustomerRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { parseUserAgent, extractIpFromRequest } from '@/lib/services/msisdn-detection';
import { VisitorSessionCreateInput, UtmParams, DeviceInfo } from '@/lib/db/models/visitor-session';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const brandId = await getBrandId();
    const body = await request.json();

    const {
      sessionId,
      landingPageId,
      landingPageSlug,
      referrer,
      utm,
      pageUrl,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const trackingRepo = getTrackingRepository(brandId);

    // Extract device info
    const userAgent = request.headers.get('user-agent') || '';
    const ip = extractIpFromRequest(request);
    const deviceInfo: DeviceInfo = parseUserAgent(userAgent);

    // Parse UTM parameters
    const utmParams: UtmParams = {
      source: utm?.source || utm?.utm_source,
      medium: utm?.medium || utm?.utm_medium,
      campaign: utm?.campaign || utm?.utm_campaign,
      adgroup: utm?.adgroup || utm?.utm_adgroup,
      creative: utm?.creative || utm?.utm_creative,
      content: utm?.content || utm?.utm_content,
      term: utm?.term || utm?.utm_term,
    };

    // Create input
    const sessionInput: VisitorSessionCreateInput = {
      sessionId,
      tenantId: brandId,
      landingPageId: landingPageId ? new ObjectId(landingPageId) : undefined,
      landingPageSlug,
      ip,
      userAgent,
      device: deviceInfo,
      referrer,
      utm: utmParams,
    };

    // Get or create session
    const session = await trackingRepo.getOrCreateSession(sessionInput);

    // Update last page URL if provided
    if (pageUrl) {
      await trackingRepo.updateSession(sessionId, { lastPageUrl: pageUrl });
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        firstSeenAt: session.firstSeenAt,
        lastSeenAt: session.lastSeenAt,
        msisdnConfidence: session.msisdnConfidence,
        networkType: session.networkType,
        pageViews: session.pageViews,
        events: session.events,
      },
    });
  } catch (error) {
    console.error('[Tracking Session API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        firstSeenAt: session.firstSeenAt,
        lastSeenAt: session.lastSeenAt,
        msisdn: session.msisdn ? '***' + session.msisdn.slice(-4) : null, // Mask for privacy
        msisdnConfidence: session.msisdnConfidence,
        networkType: session.networkType,
        carrier: session.carrier,
        device: session.device,
        pageViews: session.pageViews,
        events: session.events,
        enteredPortal: session.enteredPortal,
      },
    });
  } catch (error) {
    console.error('[Tracking Session API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
