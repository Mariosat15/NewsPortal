import { NextRequest, NextResponse } from 'next/server';
import { getTrackingRepository, getCustomerRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { extractIpFromRequest } from '@/lib/services/msisdn-detection';
import { TrackingEventCreateInput, TrackingEventType } from '@/lib/db/models/tracking-event';

const VALID_EVENT_TYPES: TrackingEventType[] = [
  'page_view',
  'scroll_depth',
  'click_banner',
  'click_cta',
  'click_link',
  'click_image',
  'enter_portal',
  'article_view',
  'article_purchase',
  'video_play',
  'video_complete',
  'form_submit',
  'session_start',
  'session_end',
];

export async function POST(request: NextRequest) {
  try {
    const brandId = await getBrandId();
    const body = await request.json();

    const { sessionId, type, metadata } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!type || !VALID_EVENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid event type. Valid types: ${VALID_EVENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const trackingRepo = getTrackingRepository(brandId);
    const customerRepo = getCustomerRepository(brandId);

    // Get session to check for MSISDN
    const session = await trackingRepo.findSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found. Create session first.' },
        { status: 404 }
      );
    }

    // Create event
    const eventInput: TrackingEventCreateInput = {
      sessionId,
      tenantId: brandId,
      msisdn: session.msisdn,
      normalizedMsisdn: session.normalizedMsisdn,
      type,
      metadata: metadata || {},
      ip: extractIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || '',
    };

    const event = await trackingRepo.createEvent(eventInput);

    // Special handling for certain event types
    if (type === 'enter_portal') {
      await trackingRepo.updateSession(sessionId, { enteredPortal: true });
    }

    // If MSISDN is known, update customer
    if (session.normalizedMsisdn) {
      await customerRepo.upsert({
        msisdn: session.msisdn!,
        normalizedMsisdn: session.normalizedMsisdn,
        tenantId: brandId,
        sessionId,
        landingPageSlug: session.landingPageSlug,
        campaign: session.utm?.campaign,
        source: session.utm?.source,
      });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event._id?.toString(),
        type: event.type,
        timestamp: event.timestamp,
      },
    });
  } catch (error) {
    console.error('[Tracking Event API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch events
export async function PUT(request: NextRequest) {
  try {
    const brandId = await getBrandId();
    const body = await request.json();

    const { sessionId, events } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required' },
        { status: 400 }
      );
    }

    const trackingRepo = getTrackingRepository(brandId);

    // Get session
    const session = await trackingRepo.findSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const ip = extractIpFromRequest(request);
    const userAgent = request.headers.get('user-agent') || '';

    const createdEvents = [];
    let enteredPortal = false;

    for (const evt of events) {
      if (!evt.type || !VALID_EVENT_TYPES.includes(evt.type)) {
        continue; // Skip invalid events
      }

      const eventInput: TrackingEventCreateInput = {
        sessionId,
        tenantId: brandId,
        msisdn: session.msisdn,
        normalizedMsisdn: session.normalizedMsisdn,
        type: evt.type,
        metadata: evt.metadata || {},
        ip,
        userAgent,
      };

      const event = await trackingRepo.createEvent(eventInput);
      createdEvents.push({
        id: event._id?.toString(),
        type: event.type,
        timestamp: event.timestamp,
      });

      if (evt.type === 'enter_portal') {
        enteredPortal = true;
      }
    }

    if (enteredPortal) {
      await trackingRepo.updateSession(sessionId, { enteredPortal: true });
    }

    return NextResponse.json({
      success: true,
      created: createdEvents.length,
      events: createdEvents,
    });
  } catch (error) {
    console.error('[Tracking Event API] Batch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
