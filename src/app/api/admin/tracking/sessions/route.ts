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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    
    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { sessionId: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
        { msisdn: { $regex: search, $options: 'i' } },
        { landingPageSlug: { $regex: search, $options: 'i' } },
      ];
    }

    const sessions = await collection
      .find(query)
      .sort({ lastSeenAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      success: true,
      sessions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
