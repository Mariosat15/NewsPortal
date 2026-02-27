import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { getBrandId } from '@/lib/brand/server';
import { Unlock } from '@/lib/db/models/unlock';
import { verifyAdmin } from '@/lib/auth/admin';

// GET - Export transactions as CSV
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const collection = await getCollection<Unlock>(brandId, 'unlocks');

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filter
    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (provider && provider !== 'all') {
      filter.paymentProvider = provider;
    }
    if (dateFrom || dateTo) {
      filter.unlockedAt = {};
      if (dateFrom) (filter.unlockedAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (filter.unlockedAt as Record<string, Date>).$lte = new Date(dateTo + 'T23:59:59');
    }

    const unlocks = await collection.find(filter).sort({ unlockedAt: -1 }).toArray();

    // Build CSV
    const headers = [
      'Transaction ID',
      'MSISDN',
      'Article ID',
      'Amount (cents)',
      'Currency',
      'Status',
      'Payment Provider',
      'Date',
    ];

    const rows = unlocks.map(unlock => [
      unlock.transactionId,
      unlock.normalizedMsisdn || unlock.msisdn,
      unlock.articleId.toString(),
      unlock.amount.toString(),
      unlock.currency,
      unlock.status,
      unlock.paymentProvider,
      new Date(unlock.unlockedAt).toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export transactions:', error);
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    );
  }
}
