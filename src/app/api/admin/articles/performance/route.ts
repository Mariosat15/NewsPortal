import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';
import { getCachedOrCompute } from '@/lib/utils/api-cache';

/**
 * GET /api/admin/articles/performance
 * Returns articles ranked by a composite performance score.
 * Score = (views × 1) + (unlocks × 50) + (revenue × 0.1)
 * Higher score = better performing article.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const cacheKey = `article-perf:${brandId}:${days}:${limit}`;
    const data = await getCachedOrCompute(cacheKey, 60, async () => {
      const articles = await getCollection(brandId, 'articles');
      const unlocks = await getCollection(brandId, 'unlocks');
      const events = await getCollection(brandId, 'tracking_events');

      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get article views from tracking events
      const viewCounts = await events.aggregate([
        { $match: { type: 'article_view', timestamp: { $gte: dateFrom } } },
        { $group: { _id: '$metadata.articleSlug', views: { $sum: 1 } } },
      ]).toArray();

      const viewMap = new Map(viewCounts.map(v => [v._id as string, v.views as number]));

      // Get unlock stats per article
      const unlockStats = await unlocks.aggregate([
        { $match: { status: 'completed', unlockedAt: { $gte: dateFrom } } },
        {
          $group: {
            _id: '$articleSlug',
            unlockCount: { $sum: 1 },
            revenue: { $sum: { $ifNull: ['$amount', 0] } },
          },
        },
      ]).toArray();

      const unlockMap = new Map(unlockStats.map(u => [
        u._id as string,
        { unlocks: u.unlockCount as number, revenue: u.revenue as number }
      ]));

      // Get all articles
      const allArticles = await articles
        .find({ status: { $in: ['published', undefined] } })
        .project({ title: 1, slug: 1, category: 1, publishDate: 1, thumbnail: 1 })
        .toArray();

      // Compute scores
      const scored = allArticles.map(a => {
        const slug = a.slug as string;
        const views = viewMap.get(slug) || 0;
        const uData = unlockMap.get(slug) || { unlocks: 0, revenue: 0 };
        
        // Reason: Composite score weights unlocks (50x) higher than views (1x) because
        // an unlock represents strong engagement + revenue. Revenue adds 0.1x as tiebreaker.
        const score = (views * 1) + (uData.unlocks * 50) + (uData.revenue * 0.1);

        return {
          title: a.title,
          slug,
          category: a.category,
          publishDate: a.publishDate,
          thumbnail: a.thumbnail,
          views,
          unlocks: uData.unlocks,
          revenue: uData.revenue,
          score: Math.round(score * 10) / 10,
          conversionRate: views > 0 ? Math.round((uData.unlocks / views) * 100 * 10) / 10 : 0,
        };
      });

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score);

      return {
        articles: scored.slice(0, limit),
        totalArticles: scored.length,
        days,
        scoringWeights: { views: 1, unlocks: 50, revenueMultiplier: 0.1 },
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Article performance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article performance' },
      { status: 500 }
    );
  }
}
