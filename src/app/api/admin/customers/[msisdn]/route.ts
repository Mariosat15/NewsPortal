import { NextRequest, NextResponse } from 'next/server';
import { getCustomerRepository, getTrackingRepository, getBillingRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { normalizePhoneNumber } from '@/lib/utils/phone';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ msisdn: string }> }
) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { msisdn } = await params;
    const normalizedMsisdn = normalizePhoneNumber(decodeURIComponent(msisdn));

    const brandId = await getBrandId();
    const customerRepo = getCustomerRepository(brandId);
    const trackingRepo = getTrackingRepository(brandId);
    const billingRepo = getBillingRepository(brandId);

    // Get customer
    const customer = await customerRepo.findByMsisdn(normalizedMsisdn);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get sessions
    const sessions = await trackingRepo.getSessionsByMsisdn(normalizedMsisdn);

    // Get events
    const events = await trackingRepo.getEventsByMsisdn(normalizedMsisdn, {
      limit: 100,
    });

    // Get billing events
    const billingEvents = await billingRepo.getByMsisdn(normalizedMsisdn, {
      limit: 50,
    });

    // Build unified timeline
    type TimelineItem = {
      type: 'session' | 'event' | 'billing';
      timestamp: Date;
      data: unknown;
    };

    const timeline: TimelineItem[] = [
      ...sessions.map(s => ({
        type: 'session' as const,
        timestamp: s.firstSeenAt,
        data: {
          sessionId: s.sessionId,
          landingPageSlug: s.landingPageSlug,
          utm: s.utm,
          device: s.device,
          networkType: s.networkType,
          pageViews: s.pageViews,
          events: s.events,
          enteredPortal: s.enteredPortal,
        },
      })),
      ...events.map(e => ({
        type: 'event' as const,
        timestamp: e.timestamp,
        data: {
          eventType: e.type,
          metadata: e.metadata,
          sessionId: e.sessionId,
        },
      })),
      ...billingEvents.map(b => ({
        type: 'billing' as const,
        timestamp: b.eventTime,
        data: {
          billingEventId: b.billingEventId,
          source: b.source,
          amount: b.amount,
          currency: b.currency,
          status: b.status,
          productCode: b.productCode,
          serviceName: b.serviceName,
        },
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json({
      success: true,
      customer,
      sessions: sessions.length,
      timeline,
    });
  } catch (error) {
    console.error('[Admin Customer Detail] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update customer notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ msisdn: string }> }
) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { msisdn } = await params;
    const normalizedMsisdn = normalizePhoneNumber(decodeURIComponent(msisdn));
    const body = await request.json();

    const brandId = await getBrandId();
    const repo = getCustomerRepository(brandId);

    const { notes, tags } = body;

    const updated = await repo.update(normalizedMsisdn, { notes, tags });

    if (!updated) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: updated,
    });
  } catch (error) {
    console.error('[Admin Customer Detail] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
