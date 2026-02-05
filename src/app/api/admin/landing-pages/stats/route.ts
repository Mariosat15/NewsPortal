import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { getBrandIdSync } from '@/lib/brand/server';
import { getLandingPageRepository, getCustomerRepository } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/landing-pages/stats
 * 
 * Returns analytics for all landing pages:
 * - Visitors (total users who visited)
 * - Identified (users with detected MSISDN)
 * - Customers (users who made a purchase)
 * - Revenue
 * - Conversion rates
 */
export async function GET(request: NextRequest) {
  // Verify admin auth
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = getBrandIdSync();
    const lpRepo = getLandingPageRepository(brandId);
    const customerRepo = getCustomerRepository(brandId);

    // Get all landing pages
    const { pages } = await lpRepo.list({ tenantId: brandId, limit: 100 });

    // Get stats for each landing page from customer data
    const customerStats = await customerRepo.getAllLandingPageStats(brandId);

    // Merge landing page info with customer stats
    const stats = pages.map(page => {
      const customerStat = customerStats.find(s => s.landingPageSlug === page.slug);
      
      return {
        id: page._id?.toString(),
        slug: page.slug,
        name: page.name,
        status: page.status,
        layout: page.layout,
        // Customer stats
        visitors: customerStat?.visitors || 0,
        customers: customerStat?.customers || 0,
        revenue: customerStat?.revenue || 0,
        conversionRate: customerStat?.conversionRate || 0,
        // Landing page stats (from landing page repo if different tracking)
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      };
    });

    // Sort by visitors descending
    stats.sort((a, b) => b.visitors - a.visitors);

    // Calculate totals
    const totals = {
      totalLandingPages: pages.length,
      activeLandingPages: pages.filter(p => p.status === 'published').length,
      totalVisitors: stats.reduce((sum, s) => sum + s.visitors, 0),
      totalCustomers: stats.reduce((sum, s) => sum + s.customers, 0),
      totalRevenue: stats.reduce((sum, s) => sum + s.revenue, 0),
      averageConversionRate: stats.length > 0
        ? stats.reduce((sum, s) => sum + s.conversionRate, 0) / stats.length
        : 0,
    };

    return NextResponse.json({
      success: true,
      stats,
      totals,
    });
  } catch (error) {
    console.error('[Landing Page Stats] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
