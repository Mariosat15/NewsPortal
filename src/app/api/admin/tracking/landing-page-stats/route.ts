import { NextResponse } from 'next/server';
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

// GET /api/admin/tracking/landing-page-stats - Get aggregated stats per landing page
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    // Note: The repository uses 'visitor_sessions' not 'tracking_sessions'
    const sessionsCollection = await getCollection(brandId, 'visitor_sessions');
    const landingPagesCollection = await getCollection(brandId, 'landing_pages');
    
    // Get all landing pages
    const landingPages = await landingPagesCollection.find({}).toArray();
    
    // Aggregate stats per landing page
    const stats = await Promise.all(
      landingPages.map(async (lp) => {
        // Sessions might store landingPageId as ObjectId or string, and landingPageSlug
        const sessions = await sessionsCollection.find({ 
          $or: [
            { landingPageId: lp._id },
            { landingPageId: lp._id.toString() },
            { landingPageSlug: lp.slug }
          ]
        }).toArray();
        
        const uniqueIps = new Set(sessions.map(s => s.ip)).size;
        const msisdnCaptured = sessions.filter(s => s.msisdn).length;
        
        // Find top source
        const sourceCounts: Record<string, number> = {};
        sessions.forEach(s => {
          const source = s.utm?.source || 'direct';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        const topSource = Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        return {
          slug: lp.slug,
          name: lp.name,
          totalVisits: sessions.length,
          uniqueVisitors: uniqueIps,
          msisdnCaptured,
          conversionRate: sessions.length > 0 ? (msisdnCaptured / sessions.length) * 100 : 0,
          topSource,
        };
      })
    );

    // Sort by total visits
    stats.sort((a, b) => b.totalVisits - a.totalVisits);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching landing page stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
