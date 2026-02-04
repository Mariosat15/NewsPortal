import { NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getArticleRepository, getUserRepository, getUnlockRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';

// GET /api/admin/stats - Get dashboard statistics
export async function GET() {
  try {
    const brandId = getBrandIdSync();
    const articleRepo = getArticleRepository(brandId);
    const userRepo = getUserRepository(brandId);
    const unlockRepo = getUnlockRepository(brandId);

    // Calculate dates
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get article stats
    const allArticles = await articleRepo.listAll({ limit: 1000 });
    const recentArticles = allArticles.articles.filter(
      a => new Date(a.createdAt) >= weekAgo
    ).length;

    // Get user stats
    const allUsers = await userRepo.listUsers({ limit: 1000 });
    const recentUsers = allUsers.users.filter(
      u => new Date(u.firstSeen) >= weekAgo
    ).length;

    // Get unlock stats
    const unlockStats = await unlockRepo.getStats();

    // Get real chart data - Top performing articles (real data)
    const topArticles = allArticles.articles
      .sort((a, b) => (b.viewCount + b.unlockCount * 10) - (a.viewCount + a.unlockCount * 10))
      .slice(0, 5)
      .map(article => ({
        title: article.title.length > 50 ? article.title.substring(0, 47) + '...' : article.title,
        views: article.viewCount,
        unlocks: article.unlockCount,
        slug: article.slug,
      }));

    // Get real views by category (real data from articles)
    const categoryStats: Record<string, { views: number; unlocks: number; articles: number }> = {};
    allArticles.articles.forEach(article => {
      const cat = article.category || 'other';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { views: 0, unlocks: 0, articles: 0 };
      }
      categoryStats[cat].views += article.viewCount;
      categoryStats[cat].unlocks += article.unlockCount;
      categoryStats[cat].articles += 1;
    });
    
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

    const viewsByCategory = Object.entries(categoryStats).map(([category, stats]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      views: stats.views,
      unlocks: stats.unlocks,
      articles: stats.articles,
      color: categoryColors[category] || '#6b7280',
    }));

    // Get collections for extended stats
    const unlocksCollection = await getCollection(brandId, 'unlocks');
    const transactionsCollection = await getCollection(brandId, 'transactions');
    const customersCollection = await getCollection(brandId, 'customers');
    const sessionsCollection = await getCollection(brandId, 'visitor_sessions');

    // Revenue by day (last 7 days) - FIXED: store in euros not cents
    const revenueByDay: { date: string; revenue: number; unlocks: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayUnlocks = await unlocksCollection.find({
        unlockedAt: { $gte: date, $lt: nextDate },
        status: 'completed',
      }).toArray();

      // Store revenue in euros (divide cents by 100)
      // Note: unlock model uses 'amount' field, not 'priceCents'
      const dayRevenueCents = dayUnlocks.reduce((sum, u) => sum + (u.amount || u.priceCents || 0), 0);
      const dayLabel = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
      
      revenueByDay.push({
        date: dayLabel,
        revenue: dayRevenueCents / 100, // Convert to euros
        unlocks: dayUnlocks.length,
      });
    }

    // User growth over last 14 days
    const userGrowth: { date: string; newUsers: number; totalUsers: number }[] = [];
    let runningTotal = 0;
    
    // Count users before 14 days ago
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    runningTotal = allUsers.users.filter(u => new Date(u.firstSeen) < fourteenDaysAgo).length;
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const newUsersCount = allUsers.users.filter(u => {
        const seen = new Date(u.firstSeen);
        return seen >= date && seen < nextDate;
      }).length;
      
      runningTotal += newUsersCount;
      
      userGrowth.push({
        date: date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
        newUsers: newUsersCount,
        totalUsers: runningTotal,
      });
    }

    // Transaction stats by status
    const allTransactions = await transactionsCollection.find({}).toArray();
    const transactionsByStatus: Record<string, number> = {};
    allTransactions.forEach(t => {
      const status = t.status || 'unknown';
      transactionsByStatus[status] = (transactionsByStatus[status] || 0) + 1;
    });

    // Revenue by article (top 5)
    const revenueByArticle = await unlocksCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$articleId', totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]).toArray();

    const articleRevenueData = await Promise.all(
      revenueByArticle.map(async (item) => {
        const article = allArticles.articles.find(a => a._id?.toString() === item._id?.toString());
        return {
          title: article?.title?.substring(0, 30) + '...' || 'Unknown',
          revenue: (item.totalRevenue || 0) / 100,
          unlocks: item.count || 0,
        };
      })
    );

    // Conversion funnel
    const totalPageViews = allArticles.articles.reduce((sum, a) => sum + a.viewCount, 0);
    const totalCustomers = await customersCollection.countDocuments({});
    const completedUnlocks = await unlocksCollection.countDocuments({ status: 'completed' });
    const returningCustomers = await customersCollection.countDocuments({ totalPurchases: { $gt: 1 } });

    const conversionFunnel = [
      { stage: 'Page Views', value: totalPageViews, color: '#3b82f6' },
      { stage: 'Paywall Shown', value: Math.floor(totalPageViews * 0.4), color: '#8b5cf6' }, // Estimate
      { stage: 'Payment Started', value: allTransactions.length, color: '#f59e0b' },
      { stage: 'Completed', value: completedUnlocks, color: '#22c55e' },
    ];

    // Landing page performance (if sessions collection exists)
    let lpPerformance: { name: string; visits: number; conversions: number; rate: number }[] = [];
    try {
      const lpCollection = await getCollection(brandId, 'landing_pages');
      const landingPages = await lpCollection.find({ status: 'published' }).toArray();
      
      lpPerformance = await Promise.all(
        landingPages.slice(0, 5).map(async (lp) => {
          const visits = await sessionsCollection.countDocuments({
            $or: [{ landingPageId: lp._id }, { landingPageSlug: lp.slug }],
          });
          const conversions = await sessionsCollection.countDocuments({
            $or: [{ landingPageId: lp._id }, { landingPageSlug: lp.slug }],
            purchaseCompleted: true,
          });
          return {
            name: lp.name || lp.slug,
            visits,
            conversions,
            rate: visits > 0 ? Math.round((conversions / visits) * 100) : 0,
          };
        })
      );
    } catch (e) {
      console.log('Landing page stats unavailable:', e);
    }

    // This week vs last week comparison
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastWeekUnlocks = await unlocksCollection.countDocuments({
      unlockedAt: { $gte: twoWeeksAgo, $lt: weekAgo },
      status: 'completed',
    });
    const thisWeekUnlocks = await unlocksCollection.countDocuments({
      unlockedAt: { $gte: weekAgo },
      status: 'completed',
    });
    
    const lastWeekRevenue = (await unlocksCollection.find({
      unlockedAt: { $gte: twoWeeksAgo, $lt: weekAgo },
      status: 'completed',
    }).toArray()).reduce((sum, u) => sum + (u.amount || 0), 0);
    
    const thisWeekRevenue = (await unlocksCollection.find({
      unlockedAt: { $gte: weekAgo },
      status: 'completed',
    }).toArray()).reduce((sum, u) => sum + (u.amount || 0), 0);

    const weekOverWeek = {
      unlocks: {
        current: thisWeekUnlocks,
        previous: lastWeekUnlocks,
        change: lastWeekUnlocks > 0 ? Math.round(((thisWeekUnlocks - lastWeekUnlocks) / lastWeekUnlocks) * 100) : 0,
      },
      revenue: {
        current: thisWeekRevenue / 100,
        previous: lastWeekRevenue / 100,
        change: lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        // Core stats
        totalArticles: allArticles.total,
        recentArticles,
        totalUsers: allUsers.total,
        recentUsers,
        totalRevenue: unlockStats.totalRevenue,
        totalUnlocks: unlockStats.totalUnlocks,
        totalCustomers,
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
        weekOverWeek,
        
        // Conversion metrics
        conversionRate: totalPageViews > 0 ? ((completedUnlocks / totalPageViews) * 100).toFixed(2) : '0',
        avgRevenuePerUser: totalCustomers > 0 ? (unlockStats.totalRevenue / 100 / totalCustomers).toFixed(2) : '0',
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
