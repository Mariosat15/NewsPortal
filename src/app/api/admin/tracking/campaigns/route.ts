import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';

/**
 * GET /api/admin/tracking/campaigns
 * Aggregates visitor session data by UTM campaign/source/medium.
 * Returns performance metrics for each campaign.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const sessions = await getCollection(brandId, 'visitor_sessions');
    const unlocks = await getCollection(brandId, 'unlocks');

    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);
    const groupBy = searchParams.get('groupBy') || 'campaign'; // campaign | source | medium

    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Determine the groupBy field
    const groupField = groupBy === 'source' ? '$utm.source'
      : groupBy === 'medium' ? '$utm.medium'
      : '$utm.campaign';

    // Aggregate sessions by campaign
    const campaignStats = await sessions.aggregate([
      {
        $match: {
          firstSeenAt: { $gte: dateFrom },
          [groupBy === 'source' ? 'utm.source' : groupBy === 'medium' ? 'utm.medium' : 'utm.campaign']: { $exists: true, $ne: null, $ne: '' },
        },
      },
      {
        $group: {
          _id: groupField,
          totalSessions: { $sum: 1 },
          totalPageViews: { $sum: '$pageViews' },
          uniqueIPs: { $addToSet: '$ip' },
          msisdnCaptured: {
            $sum: { $cond: [{ $and: [{ $ne: ['$msisdn', null] }, { $ne: ['$msisdn', ''] }] }, 1, 0] },
          },
          mobileData: {
            $sum: { $cond: [{ $eq: ['$networkType', 'MOBILE_DATA'] }, 1, 0] },
          },
          wifiCount: {
            $sum: { $cond: [{ $eq: ['$networkType', 'WIFI'] }, 1, 0] },
          },
          purchaseCompleted: {
            $sum: { $cond: ['$purchaseCompleted', 1, 0] },
          },
          avgPageViews: { $avg: '$pageViews' },
          firstSeen: { $min: '$firstSeenAt' },
          lastSeen: { $max: '$lastSeenAt' },
        },
      },
      { $sort: { totalSessions: -1 } },
      { $limit: 50 },
    ]).toArray();

    // Get revenue per campaign from unlocks cross-referenced with session UTM data
    // Reason: We aggregate unlocks by MSISDN, then match MSISDNs back to sessions to
    // attribute revenue to campaigns. This is approximate but gives useful signal.
    const revenueByMsisdn = await unlocks.aggregate([
      {
        $match: {
          unlockedAt: { $gte: dateFrom },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$normalizedMsisdn',
          totalRevenue: { $sum: { $ifNull: ['$amount', 0] } },
          transactionCount: { $sum: 1 },
        },
      },
    ]).toArray();

    const msisdnRevenueMap = new Map(
      revenueByMsisdn.map(r => [r._id as string, { revenue: r.totalRevenue, count: r.transactionCount }])
    );

    // Get MSISDN-to-campaign mapping from sessions
    const msisdnCampaigns = await sessions.aggregate([
      {
        $match: {
          normalizedMsisdn: { $exists: true, $ne: null },
          [groupBy === 'source' ? 'utm.source' : groupBy === 'medium' ? 'utm.medium' : 'utm.campaign']: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$normalizedMsisdn',
          campaign: { $first: groupField },
        },
      },
    ]).toArray();

    // Build campaign → revenue mapping
    const campaignRevenueMap = new Map<string, { revenue: number; transactions: number }>();
    for (const mc of msisdnCampaigns) {
      const campaign = mc.campaign as string;
      const revData = msisdnRevenueMap.get(mc._id as string);
      if (revData && campaign) {
        const existing = campaignRevenueMap.get(campaign) || { revenue: 0, transactions: 0 };
        existing.revenue += revData.revenue;
        existing.transactions += revData.count;
        campaignRevenueMap.set(campaign, existing);
      }
    }

    // Combine stats with revenue data
    const campaigns = campaignStats.map(c => {
      const name = (c._id as string) || 'Unknown';
      const uniqueVisitors = (c.uniqueIPs as string[]).length;
      const revData = campaignRevenueMap.get(name) || { revenue: 0, transactions: 0 };

      return {
        name,
        totalSessions: c.totalSessions,
        totalPageViews: c.totalPageViews,
        uniqueVisitors,
        msisdnCaptured: c.msisdnCaptured,
        mobileData: c.mobileData,
        wifiCount: c.wifiCount,
        purchaseCompleted: c.purchaseCompleted,
        avgPageViews: Math.round((c.avgPageViews || 0) * 10) / 10,
        revenue: revData.revenue,
        transactions: revData.transactions,
        captureRate: uniqueVisitors > 0
          ? Math.round((c.msisdnCaptured / uniqueVisitors) * 100 * 10) / 10
          : 0,
        conversionRate: uniqueVisitors > 0
          ? Math.round((c.purchaseCompleted / uniqueVisitors) * 100 * 10) / 10
          : 0,
        firstSeen: c.firstSeen,
        lastSeen: c.lastSeen,
      };
    });

    // Also get "direct" traffic (no UTM)
    const directStats = await sessions.aggregate([
      {
        $match: {
          firstSeenAt: { $gte: dateFrom },
          $or: [
            { [`utm.${groupBy === 'source' ? 'source' : groupBy === 'medium' ? 'medium' : 'campaign'}`]: { $exists: false } },
            { [`utm.${groupBy === 'source' ? 'source' : groupBy === 'medium' ? 'medium' : 'campaign'}`]: null },
            { [`utm.${groupBy === 'source' ? 'source' : groupBy === 'medium' ? 'medium' : 'campaign'}`]: '' },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalPageViews: { $sum: '$pageViews' },
          uniqueIPs: { $addToSet: '$ip' },
          msisdnCaptured: {
            $sum: { $cond: [{ $and: [{ $ne: ['$msisdn', null] }, { $ne: ['$msisdn', ''] }] }, 1, 0] },
          },
        },
      },
    ]).toArray();

    const directTraffic = directStats[0] ? {
      name: '(Direct / No UTM)',
      totalSessions: directStats[0].totalSessions,
      totalPageViews: directStats[0].totalPageViews,
      uniqueVisitors: (directStats[0].uniqueIPs as string[]).length,
      msisdnCaptured: directStats[0].msisdnCaptured,
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        directTraffic,
        groupBy,
        days,
        totalCampaigns: campaigns.length,
      },
    });
  } catch (error) {
    console.error('Campaign stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign stats' },
      { status: 500 }
    );
  }
}
