import { NextRequest, NextResponse } from 'next/server';
import { getCustomerRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { verifyAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = await getBrandId();
    const repo = getCustomerRepository(brandId);

    const msisdn = request.nextUrl.searchParams.get('msisdn') || undefined;
    const heavyUserOnly = request.nextUrl.searchParams.get('heavyUserOnly') === 'true';
    const minVisits = parseInt(request.nextUrl.searchParams.get('minVisits') || '0') || undefined;
    const campaign = request.nextUrl.searchParams.get('campaign') || undefined;
    const source = request.nextUrl.searchParams.get('source') || undefined;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    // Parse date filters
    const dateFromStr = request.nextUrl.searchParams.get('dateFrom');
    const dateToStr = request.nextUrl.searchParams.get('dateTo');
    const dateFrom = dateFromStr ? new Date(dateFromStr) : undefined;
    const dateTo = dateToStr ? new Date(dateToStr) : undefined;

    const result = await repo.search({
      msisdn,
      tenantId: brandId,
      heavyUserOnly,
      minVisits,
      campaign,
      source,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    // Get stats
    const stats = await repo.getStats(brandId);

    return NextResponse.json({
      success: true,
      customers: result.customers.map(c => ({
        ...c,
        msisdn: c.msisdn, // Full number for admin
      })),
      total: result.total,
      page,
      limit,
      stats,
    });
  } catch (error) {
    console.error('[Admin Customers] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
