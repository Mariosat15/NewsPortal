import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { getBrandIdSync } from '@/lib/brand/server';
import { getLandingPageRepository, getCustomerRepository } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/landing-pages/[id]/visitors
 * 
 * Returns visitor/customer list for a specific landing page:
 * - MSISDN (masked)
 * - Status (identified/customer)
 * - First visit date
 * - Total visits
 * - Total purchases
 * - Total spent
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Verify admin auth
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = getBrandIdSync();
    const lpRepo = getLandingPageRepository(brandId);
    const customerRepo = getCustomerRepository(brandId);

    // Get landing page
    const landingPage = await lpRepo.findById(id);
    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') as 'identified' | 'customer' | null;

    // Get detailed stats for this landing page
    const lpStats = await customerRepo.getLandingPageStats(landingPage.slug, brandId);

    // Get visitors/customers for this landing page
    let customers;
    if (status) {
      customers = await customerRepo.listByConversionStatus(status, {
        page,
        limit,
        landingPageSlug: landingPage.slug,
      });
    } else {
      // Get all (both identified and customers)
      const identified = await customerRepo.listByConversionStatus('identified', {
        page,
        limit,
        landingPageSlug: landingPage.slug,
      });
      const customersList = await customerRepo.listByConversionStatus('customer', {
        page,
        limit,
        landingPageSlug: landingPage.slug,
      });
      
      customers = {
        customers: [...identified.customers, ...customersList.customers]
          .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
          .slice(0, limit),
        total: identified.total + customersList.total,
      };
    }

    // Format visitors for response (mask MSISDN for privacy)
    const visitors = customers.customers.map(c => ({
      id: c._id,
      msisdn: maskMsisdn(c.msisdn),
      status: c.conversionStatus,
      carrier: c.carrier,
      country: c.country,
      firstSeenAt: c.firstSeenAt,
      lastSeenAt: c.lastSeenAt,
      totalVisits: c.totalVisits,
      totalPurchases: c.totalPurchases,
      totalSpent: c.totalBillingAmount,
      repurchaseCount: c.repurchaseCount || 0,
      firstLandingPage: c.firstLandingPage,
      landingPagesVisited: c.landingPagesVisited || [],
      topCampaign: c.topCampaign,
      topSource: c.topSource,
    }));

    return NextResponse.json({
      success: true,
      landingPage: {
        id: landingPage._id?.toString(),
        slug: landingPage.slug,
        name: landingPage.name,
      },
      stats: lpStats,
      visitors,
      pagination: {
        page,
        limit,
        total: customers.total,
        pages: Math.ceil(customers.total / limit),
      },
    });
  } catch (error) {
    console.error('[Landing Page Visitors] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visitors' },
      { status: 500 }
    );
  }
}

// Mask MSISDN for privacy (show first 4 and last 2 digits)
function maskMsisdn(msisdn: string): string {
  if (!msisdn || msisdn.length < 8) return msisdn;
  return msisdn.substring(0, 4) + '****' + msisdn.substring(msisdn.length - 2);
}
