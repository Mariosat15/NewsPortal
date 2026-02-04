import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  return adminToken === validToken;
}

// GET /api/admin/tracking/events - Get all tracking events
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const collection = await getCollection(brandId, 'tracking_events');
    
    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '200');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionId = searchParams.get('sessionId');
    const eventType = searchParams.get('type');
    
    // Build query
    const query: Record<string, unknown> = {};
    if (sessionId) {
      query.sessionId = sessionId;
    }
    if (eventType) {
      query.type = eventType;
    }

    const events = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      success: true,
      events,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
