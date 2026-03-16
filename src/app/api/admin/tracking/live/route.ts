import { NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

/**
 * GET /api/admin/tracking/live
 * Returns real-time active visitor counts (sessions active within last 5 minutes).
 * Also returns breakdown by landing page, network type, and device type.
 */
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const collection = await getCollection(brandId, 'visitor_sessions');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeFilter = { lastSeenAt: { $gte: fiveMinutesAgo } };

    // Parallel aggregation for all breakdowns
    const [
      totalActive,
      byLandingPage,
      byNetwork,
      byDevice,
    ] = await Promise.all([
      collection.countDocuments(activeFilter),

      // Breakdown by landing page
      collection.aggregate([
        { $match: activeFilter },
        {
          $group: {
            _id: { $ifNull: ['$landingPageSlug', 'main-site'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),

      // Breakdown by network type
      collection.aggregate([
        { $match: activeFilter },
        {
          $group: {
            _id: { $ifNull: ['$networkType', 'UNKNOWN'] },
            count: { $sum: 1 },
          },
        },
      ]).toArray(),

      // Breakdown by device type
      collection.aggregate([
        { $match: activeFilter },
        {
          $group: {
            _id: { $ifNull: ['$device.type', 'unknown'] },
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
    ]);

    // Format network breakdown into a map
    const networkBreakdown: Record<string, number> = {};
    byNetwork.forEach(n => { networkBreakdown[n._id as string] = n.count; });

    const deviceBreakdown: Record<string, number> = {};
    byDevice.forEach(d => { deviceBreakdown[d._id as string] = d.count; });

    return NextResponse.json({
      success: true,
      data: {
        totalActive,
        byLandingPage: byLandingPage.map(lp => ({
          slug: lp._id,
          count: lp.count,
        })),
        network: {
          mobile: networkBreakdown['MOBILE_DATA'] || 0,
          wifi: networkBreakdown['WIFI'] || 0,
          unknown: networkBreakdown['UNKNOWN'] || 0,
        },
        device: {
          mobile: deviceBreakdown['mobile'] || 0,
          desktop: deviceBreakdown['desktop'] || 0,
          tablet: deviceBreakdown['tablet'] || 0,
          unknown: deviceBreakdown['unknown'] || 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Live tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live data' },
      { status: 500 }
    );
  }
}
