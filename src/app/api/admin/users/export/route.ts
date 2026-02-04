import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand';
import { getUserRepository } from '@/lib/db';

// GET /api/admin/users/export - Export MSISDNs as CSV
export async function GET(request: NextRequest) {
  try {
    const brandId = getBrandIdSync();
    const repo = getUserRepository(brandId);

    const searchParams = request.nextUrl.searchParams;
    const minVisits = searchParams.get('minVisits') 
      ? parseInt(searchParams.get('minVisits')!, 10) 
      : undefined;
    const hasBookmarks = searchParams.get('hasBookmarks') === 'true';

    const msisdns = await repo.exportMsisdns({
      minVisits,
      hasBookmarks,
    });

    // Create CSV content
    const csvContent = ['msisdn', ...msisdns].join('\n');

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="msisdn-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export users' },
      { status: 500 }
    );
  }
}
