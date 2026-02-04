import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollection } from '@/lib/db/mongodb';
import { getBrandId } from '@/lib/brand/server';
import { Unlock } from '@/lib/db/models/unlock';

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  return adminToken === validToken;
}

// GET - Get transaction statistics
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const collection = await getCollection<Unlock>(brandId, 'unlocks');

    // Aggregate stats
    const [overallStats, statusCounts] = await Promise.all([
      collection.aggregate([
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
              }
            },
            uniqueUsers: { $addToSet: '$normalizedMsisdn' },
          },
        },
        {
          $project: {
            totalTransactions: 1,
            totalRevenue: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
          },
        },
      ]).toArray(),
      collection.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
    ]);

    const stats = overallStats[0] || {
      totalTransactions: 0,
      totalRevenue: 0,
      uniqueUsers: 0,
    };

    // Map status counts
    const statusMap = new Map(statusCounts.map(s => [s._id, s.count]));

    return NextResponse.json({
      success: true,
      data: {
        totalTransactions: stats.totalTransactions,
        totalRevenue: stats.totalRevenue,
        uniqueUsers: stats.uniqueUsers,
        completedCount: statusMap.get('completed') || 0,
        pendingCount: statusMap.get('pending') || 0,
        failedCount: statusMap.get('failed') || 0,
        refundedCount: statusMap.get('refunded') || 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch transaction stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction stats' },
      { status: 500 }
    );
  }
}
