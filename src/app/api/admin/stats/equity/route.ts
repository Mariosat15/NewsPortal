import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

/**
 * GET /api/admin/stats/equity — Cumulative revenue & unlocks over time
 *
 * Returns per-transaction-level data points so the frontend can render
 * a live equity-style chart (PnL curve) that visibly moves with each sale.
 *
 * Query params:
 *   days   – look-back window (default 7, max 365)
 *   after  – ISO timestamp; only return data points after this time (for efficient polling)
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = getBrandIdSync();
    const searchParams = request.nextUrl.searchParams;
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10), 1), 365);
    const afterParam = searchParams.get('after'); // ISO string for incremental polling

    const now = new Date();
    const rangeStart = afterParam
      ? new Date(afterParam)
      : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const unlocksCollection = await getCollection(brandId, 'unlocks');

    // ── Fetch all completed unlocks in the window, ordered by time ──
    const unlocks = await unlocksCollection
      .find(
        {
          unlockedAt: { $gte: rangeStart },
          status: 'completed',
        },
        {
          projection: { unlockedAt: 1, amount: 1, priceCents: 1 },
          sort: { unlockedAt: 1 },
        }
      )
      .toArray();

    // ── If polling with `after`, we need the baseline (cumulative total before this window) ──
    let baseline = 0;
    let baselineUnlocks = 0;
    if (!afterParam) {
      // For the full window, get total before rangeStart
      const [baselineAgg] = await unlocksCollection
        .aggregate([
          { $match: { unlockedAt: { $lt: rangeStart }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', { $ifNull: ['$priceCents', 0] }] } }, count: { $sum: 1 } } },
        ])
        .toArray();
      baseline = (baselineAgg?.total || 0) / 100;
      baselineUnlocks = baselineAgg?.count || 0;
    }

    // ── Build cumulative equity curve ──
    const equityPoints: {
      timestamp: string;
      revenue: number;       // individual transaction amount (€)
      cumRevenue: number;     // cumulative revenue (€)
      cumUnlocks: number;     // cumulative unlock count
    }[] = [];

    let cumRevenue = baseline;
    let cumUnlocks = baselineUnlocks;

    // Add a starting point at the beginning of the window (if full load)
    if (!afterParam) {
      equityPoints.push({
        timestamp: rangeStart.toISOString(),
        revenue: 0,
        cumRevenue,
        cumUnlocks,
      });
    }

    for (const unlock of unlocks) {
      const amount = ((unlock.amount || unlock.priceCents || 0) as number) / 100;
      cumRevenue += amount;
      cumUnlocks += 1;

      equityPoints.push({
        timestamp: (unlock.unlockedAt as Date).toISOString(),
        revenue: amount,
        cumRevenue: Math.round(cumRevenue * 100) / 100,
        cumUnlocks,
      });
    }

    // For the full window, add a "now" point so the line extends to current time
    if (!afterParam && equityPoints.length > 0) {
      const lastPoint = equityPoints[equityPoints.length - 1];
      if (new Date(lastPoint.timestamp).getTime() < now.getTime() - 60000) {
        equityPoints.push({
          timestamp: now.toISOString(),
          revenue: 0,
          cumRevenue: lastPoint.cumRevenue,
          cumUnlocks: lastPoint.cumUnlocks,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        equityPoints,
        baseline,
        baselineUnlocks,
        totalRevenue: cumRevenue,
        totalUnlocks: cumUnlocks,
        lastTimestamp: equityPoints.length > 0 ? equityPoints[equityPoints.length - 1].timestamp : now.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Equity stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch equity data' },
      { status: 500 }
    );
  }
}
