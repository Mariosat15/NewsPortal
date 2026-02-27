import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getUnlockRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';
import { ObjectId } from 'mongodb';

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = getBrandIdSync();
    const unlockRepo = getUnlockRepository(brandId);

    // Get date range from query params (default 7 days, max 90)
    const searchParams = request.nextUrl.searchParams;
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10), 1), 365);

    // Calculate dates
    const now = new Date();
    const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get collections
    const articlesCollection = await getCollection(brandId, 'articles');
    const usersCollection = await getCollection(brandId, 'users');
    const unlocksCollection = await getCollection(brandId, 'unlocks');
    const customersCollection = await getCollection(brandId, 'customers');
    const sessionsCollection = await getCollection(brandId, 'visitor_sessions');

    // ── Article stats via aggregation (no full load) ──
    const [articleCounts, recentArticleCount] = await Promise.all([
      articlesCollection.countDocuments({}),
      articlesCollection.countDocuments({ createdAt: { $gte: weekAgo } }),
    ]);

    // ── User stats via aggregation (no full load) ──
    const [userCounts, recentUserCount] = await Promise.all([
      usersCollection.countDocuments({}),
      usersCollection.countDocuments({ firstSeen: { $gte: weekAgo } }),
    ]);

    // ── Unlock stats ──
    const unlockStats = await unlockRepo.getStats();

    // ── Top articles — aggregation with sort + limit (only fetches 5 docs) ──
    const topArticlesAgg = await articlesCollection.aggregate([
      {
        $addFields: {
          score: { $add: [{ $ifNull: ['$viewCount', 0] }, { $multiply: [{ $ifNull: ['$unlockCount', 0] }, 10] }] },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          viewCount: 1,
          unlockCount: 1,
          slug: 1,
        },
      },
    ]).toArray();

    const topArticles = topArticlesAgg.map(a => ({
      title: (a.title?.length || 0) > 50 ? a.title.substring(0, 47) + '...' : a.title || '',
      views: a.viewCount || 0,
      unlocks: a.unlockCount || 0,
      slug: a.slug,
    }));

    // ── Views by category — single aggregation ──
    const categoryAgg = await articlesCollection.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$category', 'other'] },
          views: { $sum: { $ifNull: ['$viewCount', 0] } },
          unlocks: { $sum: { $ifNull: ['$unlockCount', 0] } },
          articles: { $sum: 1 },
        },
      },
    ]).toArray();

    const categoryColors: Record<string, string> = {
      news: '#3b82f6',
      technology: '#8b5cf6',
      health: '#22c55e',
      finance: '#f59e0b',
      sports: '#ef4444',
      lifestyle: '#ec4899',
      entertainment: '#06b6d4',
      business: '#14b8a6',
      other: '#6b7280',
    };

    const viewsByCategory = categoryAgg.map(c => ({
      category: (c._id as string).charAt(0).toUpperCase() + (c._id as string).slice(1),
      views: c.views,
      unlocks: c.unlocks,
      articles: c.articles,
      color: categoryColors[c._id as string] || '#6b7280',
    }));

    // ── Total page views — single aggregation ──
    const [pageViewsAgg] = await articlesCollection.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$viewCount', 0] } } } },
    ]).toArray() || [];
    const totalPageViews = pageViewsAgg?.total || 0;

    // ── Revenue by day — single aggregation with zero-fill ──
    const revenueAgg = await unlocksCollection.aggregate([
      {
        $match: {
          unlockedAt: { $gte: rangeStart },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$unlockedAt' } },
          revenue: { $sum: { $ifNull: ['$amount', { $ifNull: ['$priceCents', 0] }] } },
          unlocks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const revenueMap = new Map(revenueAgg.map(r => [r._id, r]));
    const revenueByDay: { date: string; revenue: number; unlocks: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateKey = date.toISOString().split('T')[0];
      const dayData = revenueMap.get(dateKey);

      const dayLabel = days <= 7
        ? date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      revenueByDay.push({
        date: dayLabel,
        revenue: (dayData?.revenue || 0) / 100,
        unlocks: dayData?.unlocks || 0,
      });
    }

    // ── User growth — aggregation instead of loading all users ──
    const growthDays = Math.max(days, 14);
    const growthStart = new Date(now.getTime() - growthDays * 24 * 60 * 60 * 1000);

    // Count users before the growth window (baseline)
    const baselineUsers = await usersCollection.countDocuments({ firstSeen: { $lt: growthStart } });

    // Get daily new-user counts via aggregation
    const userGrowthAgg = await usersCollection.aggregate([
      { $match: { firstSeen: { $gte: growthStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$firstSeen' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const growthMap = new Map(userGrowthAgg.map(g => [g._id, g.count as number]));
    const userGrowth: { date: string; newUsers: number; totalUsers: number }[] = [];
    let runningTotal = baselineUsers;

    for (let i = growthDays - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateKey = date.toISOString().split('T')[0];
      const newUsersCount = growthMap.get(dateKey) || 0;
      runningTotal += newUsersCount;

      userGrowth.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newUsers: newUsersCount,
        totalUsers: runningTotal,
      });
    }

    // ── Transaction stats by status — aggregation ──
    const statusAgg = await unlocksCollection.aggregate([
      { $group: { _id: { $ifNull: ['$status', 'unknown'] }, count: { $sum: 1 } } },
    ]).toArray();
    const transactionsByStatus: Record<string, number> = {};
    statusAgg.forEach(s => {
      transactionsByStatus[s._id as string] = s.count;
    });

    // ── Revenue by article (top 5) — aggregation + targeted lookup ──
    const revenueByArticle = await unlocksCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$articleId', totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]).toArray();

    // Fetch only the 5 article titles we need instead of all articles
    const articleIds = revenueByArticle
      .map(item => {
        try { return new ObjectId(item._id as string); } catch { return null; }
      })
      .filter((id): id is ObjectId => id !== null);

    const revenueArticles = articleIds.length > 0
      ? await articlesCollection.find(
          { _id: { $in: articleIds } },
          { projection: { title: 1 } }
        ).toArray()
      : [];
    const articleTitleMap = new Map(revenueArticles.map(a => [a._id.toString(), a.title]));

    const articleRevenueData = revenueByArticle.map(item => ({
      title: (articleTitleMap.get(item._id?.toString() || '') || 'Unknown').substring(0, 30) + '...',
      revenue: (item.totalRevenue || 0) / 100,
      unlocks: item.count || 0,
    }));

    // ── Conversion funnel ──
    const completedUnlocks = await unlocksCollection.countDocuments({ status: 'completed' });

    // Customer stats via aggregation
    const [customerStatsAgg, returningStatsAgg] = await Promise.all([
      unlocksCollection.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$msisdn' } },
        { $count: 'total' },
      ]).toArray(),
      unlocksCollection.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$msisdn', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: 'total' },
      ]).toArray(),
    ]);

    const actualCustomers = customerStatsAgg[0]?.total || 0;
    const returningCustomers = returningStatsAgg[0]?.total || 0;

    const paywallShown = completedUnlocks > 0 ? Math.max(completedUnlocks * 3, totalPageViews > 0 ? Math.floor(totalPageViews * 0.4) : completedUnlocks * 3) : 0;
    const paymentStarted = completedUnlocks > 0 ? Math.max(completedUnlocks, Math.floor(paywallShown * 0.5)) : 0;

    const conversionFunnel = [
      { stage: 'Page Views', value: totalPageViews || completedUnlocks * 10, color: '#3b82f6' },
      { stage: 'Paywall Shown', value: paywallShown, color: '#8b5cf6' },
      { stage: 'Payment Started', value: paymentStarted, color: '#f59e0b' },
      { stage: 'Completed', value: completedUnlocks, color: '#22c55e' },
    ];

    // ── Landing page performance ──
    let lpPerformance: { name: string; visits: number; conversions: number; rate: number }[] = [];
    try {
      const lpCollection = await getCollection(brandId, 'landing_pages');
      const landingPages = await lpCollection.find(
        { status: 'published' },
        { projection: { name: 1, slug: 1 } }
      ).limit(5).toArray();

      lpPerformance = await Promise.all(
        landingPages.map(async (lp) => {
          const [visits, conversions] = await Promise.all([
            sessionsCollection.countDocuments({
              $or: [{ landingPageId: lp._id }, { landingPageSlug: lp.slug }],
            }),
            sessionsCollection.countDocuments({
              $or: [{ landingPageId: lp._id }, { landingPageSlug: lp.slug }],
              purchaseCompleted: true,
            }),
          ]);
          return {
            name: lp.name || lp.slug,
            visits,
            conversions,
            rate: visits > 0 ? Math.round((conversions / visits) * 100) : 0,
          };
        })
      );
    } catch (e) {
      // Landing page stats are optional — fail silently
    }

    // ── Period comparison — aggregation ──
    const previousRangeStart = new Date(rangeStart.getTime() - days * 24 * 60 * 60 * 1000);

    const [previousUnlocks, currentUnlocks, previousRevenueArr, currentRevenueArr] = await Promise.all([
      unlocksCollection.countDocuments({
        unlockedAt: { $gte: previousRangeStart, $lt: rangeStart },
        status: 'completed',
      }),
      unlocksCollection.countDocuments({
        unlockedAt: { $gte: rangeStart },
        status: 'completed',
      }),
      unlocksCollection.aggregate([
        { $match: { unlockedAt: { $gte: previousRangeStart, $lt: rangeStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 0] } } } },
      ]).toArray(),
      unlocksCollection.aggregate([
        { $match: { unlockedAt: { $gte: rangeStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 0] } } } },
      ]).toArray(),
    ]);

    const previousRevenue = previousRevenueArr[0]?.total || 0;
    const currentRevenue = currentRevenueArr[0]?.total || 0;

    const periodComparison = {
      unlocks: {
        current: currentUnlocks,
        previous: previousUnlocks,
        change: previousUnlocks > 0 ? Math.round(((currentUnlocks - previousUnlocks) / previousUnlocks) * 100) : (currentUnlocks > 0 ? 100 : 0),
      },
      revenue: {
        current: currentRevenue / 100,
        previous: previousRevenue / 100,
        change: previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : (currentRevenue > 0 ? 100 : 0),
      },
    };

    // ── Derived metrics ──
    const conversionRate = totalPageViews > 0
      ? ((completedUnlocks / totalPageViews) * 100).toFixed(2)
      : (completedUnlocks > 0 ? '100' : '0');

    const avgRevenuePerUser = actualCustomers > 0
      ? (unlockStats.totalRevenue / 100 / actualCustomers).toFixed(2)
      : '0';

    return NextResponse.json({
      success: true,
      data: {
        // Core stats
        totalArticles: articleCounts,
        recentArticles: recentArticleCount,
        totalUsers: userCounts,
        recentUsers: recentUserCount,
        totalRevenue: unlockStats.totalRevenue,
        totalUnlocks: unlockStats.totalUnlocks,
        totalCustomers: actualCustomers,
        returningCustomers,

        // Charts data
        topArticles,
        viewsByCategory,
        revenueByDay,
        userGrowth,
        transactionsByStatus,
        articleRevenueData,
        conversionFunnel,
        lpPerformance,
        weekOverWeek: periodComparison,

        // Conversion metrics
        conversionRate,
        avgRevenuePerUser,

        // Current filter
        daysFilter: days,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
