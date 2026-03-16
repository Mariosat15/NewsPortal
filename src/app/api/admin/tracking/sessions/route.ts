import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

// GET /api/admin/tracking/sessions - Get all visitor sessions
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    // Note: The repository uses 'visitor_sessions' not 'tracking_sessions'
    const collection = await getCollection(brandId, 'visitor_sessions');
    
    // Get query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam !== null ? parseInt(limitParam) : 100;
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const networkType = searchParams.get('networkType');
    
    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { sessionId: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
        { msisdn: { $regex: search, $options: 'i' } },
        { landingPageSlug: { $regex: search, $options: 'i' } },
        { carrier: { $regex: search, $options: 'i' } },
      ];
    }

    // Network type filter
    if (networkType && networkType !== 'ALL') {
      query.networkType = networkType;
    }

    // Fetch sessions - limit=0 means no limit (fetch all)
    const cursor = collection
      .find(query)
      .sort({ lastSeenAt: -1 })
      .skip(offset);
    
    if (limit > 0) {
      cursor.limit(limit);
    }

    const sessions = await cursor.toArray();
    const total = await collection.countDocuments(query);

    // Aggregate network type counts across ALL data (not just current page)
    const totalMobile = await collection.countDocuments({ networkType: 'MOBILE_DATA' });
    const totalWifi = await collection.countDocuments({ networkType: 'WIFI' });
    const totalUnknown = await collection.countDocuments({
      $or: [
        { networkType: 'UNKNOWN' },
        { networkType: { $exists: false } },
        { networkType: null },
      ],
    });

    return NextResponse.json({
      success: true,
      sessions,
      total,
      limit,
      offset,
      totalMobile,
      totalWifi,
      totalUnknown,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
