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

    // Parse parameters
    const minVisits = parseInt(request.nextUrl.searchParams.get('minVisits') || '3');
    const campaign = request.nextUrl.searchParams.get('campaign') || undefined;
    const source = request.nextUrl.searchParams.get('source') || undefined;
    const format = request.nextUrl.searchParams.get('format') || 'csv';

    // Parse date range (default to last 30 days)
    const dateFromStr = request.nextUrl.searchParams.get('dateFrom');
    const dateToStr = request.nextUrl.searchParams.get('dateTo');
    
    const dateTo = dateToStr ? new Date(dateToStr) : new Date();
    const dateFrom = dateFromStr 
      ? new Date(dateFromStr) 
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get heavy users
    const customers = await repo.getHeavyUsers({
      tenantId: brandId,
      dateFrom,
      dateTo,
      minVisits,
      campaign,
      source,
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        exportedAt: new Date().toISOString(),
        filters: {
          minVisits,
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString(),
          campaign,
          source,
        },
        total: customers.length,
        customers: customers.map(c => ({
          msisdn: c.msisdn,
          visits: c.totalVisits,
          visitsLast30d: c.visitsLast30d,
          firstSeen: c.firstSeenAt,
          lastSeen: c.lastSeenAt,
          topCampaign: c.topCampaign,
          topSource: c.topSource,
          totalBilling: c.totalBillingAmount,
        })),
      });
    }

    // CSV format
    const headers = [
      'msisdn',
      'total_visits',
      'visits_last_30d',
      'first_seen',
      'last_seen',
      'top_campaign',
      'top_source',
      'total_billing_cents',
    ];

    const rows = customers.map(c => [
      c.msisdn,
      c.totalVisits.toString(),
      c.visitsLast30d.toString(),
      c.firstSeenAt.toISOString(),
      c.lastSeenAt.toISOString(),
      c.topCampaign || '',
      c.topSource || '',
      c.totalBillingAmount.toString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const filename = `heavy_users_${dateFrom.toISOString().split('T')[0]}_${dateTo.toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Admin Customer Export] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
